import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ServiceBusReceiverOptions,
} from '@azure/service-bus';
import { Redis } from 'ioredis';
import { gmail_v1 } from '@googleapis/gmail';
import { ConfigService } from '@nestjs/config';

import {
  redisFactory,
  createGmailClient,
  getServiceBusClient,
} from '../common/utils';
import { ThreadData } from '../common/interfaces';
import { AgentsService } from '../agents/agents.service';
import { SupabaseConfig } from '../config/supabase.config';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class ReceiverService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private receiver: ServiceBusReceiver;
  private readonly sbClient: ServiceBusClient;
  private readonly processingMessages = new Set<string>();
  private readonly logger = new Logger(ReceiverService.name);

  private activeProcessingCount = 0;
  private readonly BATCH_SIZE = 100;
  private readonly MAX_THREADS_PER_USER = 500;
  private readonly MAX_CONCURRENT_MESSAGES = 10;

  constructor(
    private readonly supabase: SupabaseConfig,
    private readonly configService: ConfigService,
    private readonly agentsService: AgentsService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.redis = redisFactory(configService);
    this.sbClient = getServiceBusClient(configService);
  }

  async onModuleInit() {
    try {
      const options: ServiceBusReceiverOptions = {
        receiveMode: 'peekLock',
      };
      this.receiver = this.sbClient.createReceiver('annotate', options);
      await this.setupMessageHandler();
      this.logger.log(
        `ReceiverService initialized with max ${this.MAX_CONCURRENT_MESSAGES} concurrent messages`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize module', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.activeProcessingCount > 0) {
        this.logger.log(
          `Waiting for ${this.activeProcessingCount} active messages to complete`,
        );
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (this.activeProcessingCount === 0) {
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });
      }

      await this.receiver?.close();
      await this.sbClient.close();
      await this.redis.quit();
      this.logger.log('ReceiverService cleaned up successfully');
    } catch (error) {
      this.logger.error('Error during cleanup', error);
    }
  }

  private async setupMessageHandler() {
    this.receiver.subscribe({
      processMessage: async (message) => {
        const messageId = message.messageId?.toString() || '';
        if (this.processingMessages.has(messageId)) {
          this.logger.debug(`Message ${messageId} is already being processed`);
          return;
        }

        if (this.activeProcessingCount >= this.MAX_CONCURRENT_MESSAGES) {
          this.logger.debug('Maximum concurrent messages reached, waiting...');
          return;
        }

        this.activeProcessingCount++;
        this.processingMessages.add(messageId);

        try {
          this.logger.debug(
            `Starting message processing. Active count: ${this.activeProcessingCount}`,
          );

          await this.processMessage(message);
          await this.receiver.completeMessage(message);

          this.logger.debug(`Message ${messageId} processed successfully`);
        } catch (error) {
          this.logger.error(`Error processing message: ${error instanceof Error ? error.message : String(error)}`);
          await this.handleMessageError(message, error instanceof Error ? error : new Error(String(error)));
        } finally {
          this.processingMessages.delete(messageId);
          this.activeProcessingCount--;
          this.logger.debug(
            `Completed message processing. Active count: ${this.activeProcessingCount}`,
          );
        }
      },
      processError: async (error) => {
        this.logger.error(`Error from subscription: ${error}`);
      },
    });
  }

  private async processMessage(message: any) {
    const body = message.body;
    this.logger.debug(`Processing message for user: ${body.userId}`);

    const gmail = createGmailClient(body.accessToken);
    const existingThreads = await this.getExistingThreads(body.userId);
    const paginationKey = `pagination:${body.userId}`;

    const threadIds = await this.fetchNewThreads(
      gmail,
      existingThreads,
      body.userId,
      paginationKey,
    );

    await this.processThreads(gmail, threadIds, body.userId);
  }

  private async handleMessageError(message: any, error: Error) {
    const retryCount = (message.deliveryCount || 0) + 1;
    const maxRetries = 3;

    if (retryCount <= maxRetries) {
      await this.receiver.abandonMessage(message);
      this.logger.warn(
        `Message abandoned for retry. Attempt ${retryCount} of ${maxRetries}`,
        { messageId: message.messageId?.toString() },
      );
    } else {
      await this.receiver.deadLetterMessage(message, {
        deadLetterReason: 'Max retries exceeded',
        deadLetterErrorDescription: error instanceof Error ? error.message : String(error),
      });
      this.logger.error(
        `Message moved to dead letter queue after ${maxRetries} retries`,
        { messageId: message.messageId?.toString(), error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  private async getExistingThreads(userId: string): Promise<string[]> {
    const { data: existingThreads, error } = await this.supabase
      .from('thread_embeddings')
      .select('thread_id')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch existing threads: ${error instanceof Error ? error.message : String(error)}`);
    }

    return existingThreads?.map((t) => t.thread_id) || [];
  }

  private async fetchThreadBatch(
    gmail: gmail_v1.Gmail,
    pageToken?: string,
  ): Promise<any> {
    try {
      const response = await gmail.users.threads.list({
        userId: 'me',
        maxResults: this.BATCH_SIZE,
        pageToken,
        q: 'in:inbox -in:chats is:important larger_than:1',
      });

      return {
        items: response.data.threads || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      this.logger.error(`Error fetching thread batch: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async batchGetMessages(
    gmail: gmail_v1.Gmail,
    messageIds: string[],
  ): Promise<any[]> {
    try {
      const messages = await Promise.all(
        messageIds.map((id) =>
          gmail.users.messages.get({
            userId: 'me',
            id,
          }),
        ),
      );
      return messages.map((response) => response.data);
    } catch (error) {
      this.logger.error(`Error batch getting messages: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processThreads(
    gmail: gmail_v1.Gmail,
    threadIds: string[],
    userId: string,
  ) {
    // Process threads in batches
    for (let i = 0; i < threadIds.length; i += this.BATCH_SIZE) {
      const batchThreadIds = threadIds.slice(i, i + this.BATCH_SIZE);

      try {
        // Get all thread data in parallel
        const threadsData = await Promise.all(
          batchThreadIds.map(async (threadId) => {
            try {
              const response = await gmail.users.threads.get({
                userId: 'me',
                id: threadId,
              });
              return response.data;
            } catch (error) {
              this.logger.error(
                `Error fetching thread ${threadId}: ${error instanceof Error ? error.message : String(error)}`,
              );
              return null;
            }
          }),
        );

        // Filter out failed thread fetches and extract message IDs
        const messageIds = threadsData
          .filter((thread): thread is ThreadData => thread !== null)
          .flatMap((thread) =>
            (thread.messages || [])
              .map((message) => message.id)
              .filter((id): id is string => id !== undefined),
          );

        if (messageIds.length === 0) {
          continue;
        }

        // Batch get all messages
        await this.batchGetMessages(gmail, messageIds);

        // Process the batch of messages
        await this.agentsService.autoAnnotate(gmail, batchThreadIds, userId);

        // Process embeddings for each thread in parallel
        await Promise.all(
          batchThreadIds.map((threadId) =>
            this.processThread(threadId, userId).catch((error) => {
              this.logger.error(
                `Failed to process thread ${threadId}: ${error.message}`,
              );
            }),
          ),
        );
      } catch (error) {
        this.logger.error(
          `Error processing batch of threads: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private async fetchNewThreads(
    gmail: gmail_v1.Gmail,
    existingThreadIds: string[],
    userId: string,
    paginationKey: string,
  ): Promise<string[]> {
    const threadIds = new Set<string>();
    let pageToken = await this.redis.get(paginationKey);
    const remainingThreadsNeeded =
      this.MAX_THREADS_PER_USER - existingThreadIds.length;

    if (remainingThreadsNeeded <= 0) {
      this.logger.debug(
        `User ${userId} already has ${existingThreadIds.length} threads, skipping`,
      );
      return [];
    }

    try {
      const existingThreadsSet = new Set(existingThreadIds);

      while (
        pageToken !== undefined &&
        threadIds.size < remainingThreadsNeeded
      ) {
        const threads = await this.fetchThreadBatch(gmail, pageToken);
        pageToken = threads.nextPageToken;

        // Filter threads in memory
        for (const thread of threads.items) {
          if (threadIds.size >= remainingThreadsNeeded) break;
          if (thread.id && !existingThreadsSet.has(thread.id)) {
            threadIds.add(thread.id);
          }
        }
      }

      // Update pagination state
      if (!pageToken || threadIds.size >= remainingThreadsNeeded) {
        await this.redis.del(paginationKey);
      } else {
        await this.redis.set(paginationKey, pageToken, 'EX', 60 * 60);
      }

      return Array.from(threadIds);
    } catch (error) {
      this.logger.error(`Error fetching threads: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async processThread(threadId: string, userId: string) {
    try {
      const { data: threadAnnotations, error } = await this.supabase
        .from('annotations')
        .select('*, recipients (*)')
        .eq('thread_id', threadId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to fetch thread annotations: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (threadAnnotations?.length > 0) {
        const firstAnnotation = threadAnnotations[0];
        await this.embeddingsService.processThread(
          userId,
          {
            threadId: threadId,
            date: firstAnnotation.created_at,
          },
          firstAnnotation.recipients,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing thread ${threadId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
