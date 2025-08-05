import * as hub from 'langchain/hub';
import { convert } from 'html-to-text';
import * as parseAuthor from 'parse-author';
import { ConfigService } from '@nestjs/config';
import { SyncRedactor } from 'redact-pii-light';
import type { gmail_v1 } from '@googleapis/gmail';
import { AzureChatOpenAI } from '@langchain/openai';
import * as parseMessage from 'gmail-api-parse-message';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { SupabaseConfig } from '../config/supabase.config';

/**
 * AgentsService - AI-Powered Email Analysis Service
 * 
 * This service orchestrates AI-powered analysis of Gmail messages using Azure OpenAI
 * to extract insights, annotations, and communication patterns. It handles:
 * 
 * - Email thread processing and parsing
 * - AI-driven content analysis and annotation
 * - PII redaction for privacy compliance
 * - Communication pattern extraction
 * - Structured data validation and storage
 * 
 * Key Features:
 * - Uses GPT-4o for intelligent email analysis
 * - Implements rate limiting and retry logic
 * - Validates data against database enum types
 * - Redacts sensitive information before AI processing
 * - Stores structured annotations and recipient profiles
 * 
 * @example
 * ```typescript
 * // Process Gmail threads for AI analysis
 * const results = await agentsService.autoAnnotate(gmail, threadIds, userId);
 * 
 * // Extract communication patterns from message content
 * const patterns = await agentsService.extractPatterns(messageContent);
 * ```
 */
@Injectable()
export class AgentsService implements OnModuleInit {
  /** LangChain prompt for email annotation tasks */
  private annotatePrompt: any;
  
  /** LangChain prompt for communication pattern extraction */
  private patternsPrompt: any;
  
  /** Azure OpenAI GPT-4o instance for AI analysis */
  private readonly llm: AzureChatOpenAI;
  
  /** PII redaction service for privacy compliance */
  private readonly redactor: SyncRedactor;
  
  /** Service logger instance */
  private readonly logger = new Logger(AgentsService.name);

  /**
   * Initialize the AgentsService with required dependencies
   * 
   * @param supabase - Supabase database configuration and client
   * @param configService - NestJS configuration service for environment variables
   */
  constructor(
    private readonly supabase: SupabaseConfig,
    private readonly configService: ConfigService,
  ) {
    // Configure PII redactor with custom settings (names redaction disabled for email context)
    this.redactor = new SyncRedactor({
      builtInRedactors: {
        names: {
          enabled: false, // Keep names for communication context analysis
        },
      },
    });
    
    // Initialize Azure OpenAI client with production-ready configuration
    this.llm = new AzureChatOpenAI({
      model: 'gpt-4o',
      azureOpenAIApiVersion: '2024-08-01-preview',
      azureOpenAIApiDeploymentName: 'warpmail-core-api',
      azureOpenAIApiKey: this.configService.getOrThrow<string>('AZURE_API_KEY'),
      azureOpenAIApiInstanceName: this.configService.getOrThrow<string>(
        'AZURE_RESOURCE_NAME',
      ),
      maxRetries: 3,        // Retry failed requests up to 3 times
      timeout: 60000,       // 60 second timeout for AI requests
      maxConcurrency: 5,    // Limit concurrent AI requests to prevent rate limiting
    });
  }

  /**
   * Initialize LangChain prompts from the hub during module startup
   * 
   * Loads specialized prompts for:
   * - Email annotation and analysis
   * - Communication style pattern extraction
   * 
   * @throws Logs error if prompt loading fails but allows service to continue
   */
  async onModuleInit() {
    try {
      this.annotatePrompt = await hub.pull('warpmail-annotate-email');
      this.patternsPrompt = await hub.pull('warpmail-extract-style-patterns');
    } catch (error) {
      this.logger.error('Failed to initialize module', error);
    }
  }

  /**
   * Fetch a single Gmail message by ID
   * 
   * @param messageId - Gmail message ID to retrieve
   * @param gmail - Authenticated Gmail API client
   * @param format - Message format ('full' includes body, 'metadata' excludes body)
   * @returns Promise resolving to Gmail message data
   * @private
   */
  private async getMessage(
    messageId: string,
    gmail: gmail_v1.Gmail,
    format?: 'full' | 'metadata',
  ): Promise<any> {
    return await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format,
    });
  }

  /**
   * Fetch a complete Gmail thread with all messages
   * 
   * @param threadId - Gmail thread ID to retrieve
   * @param gmail - Authenticated Gmail API client
   * @returns Promise resolving to Gmail thread data with all messages
   * @private
   */
  private async getThreadData(
    threadId: string,
    gmail: gmail_v1.Gmail,
  ): Promise<any> {
    return await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });
  }

  /**
   * Automatically analyze and annotate Gmail threads using AI
   * 
   * This is the primary method for processing email threads. It:
   * 1. Fetches existing annotations to avoid duplicate processing
   * 2. Retrieves Gmail thread data and individual messages
   * 3. Parses and redacts email content for privacy
   * 4. Uses AI to analyze content and extract insights
   * 5. Validates and stores structured annotations
   * 6. Creates or updates recipient profiles
   * 
   * @param gmail - Authenticated Gmail API client
   * @param threadIds - Array of Gmail thread IDs to process
   * @param userId - User ID for data ownership and filtering
   * @returns Promise resolving to array of created annotations
   * 
   * @example
   * ```typescript
   * const gmail = await getGmailClient(user.accessToken);
   * const annotations = await agentsService.autoAnnotate(
   *   gmail, 
   *   ['thread123', 'thread456'], 
   *   'user789'
   * );
   * console.log(`Created ${annotations.length} new annotations`);
   * ```
   * 
   * @throws Logs individual thread errors but continues processing other threads
   * @throws Re-throws errors for database or configuration issues
   */
  async autoAnnotate(
    gmail: gmail_v1.Gmail,
    threadIds: string[],
    userId: string,
  ): Promise<any[]> {
    const results = [];
    try {
      // Fetch existing annotations to avoid duplicate processing
      const { data: annotations } = await this.supabase
        .from('annotations')
        .select()
        .eq('user_id', userId);

      // Process each thread sequentially to avoid rate limiting
      for (const threadId of threadIds) {
        try {
          const threadData = await this.getThreadData(threadId, gmail);

          if (threadData.data.messages?.length) {
            const messages = threadData.data.messages;
            
            // Process each message in the thread
            for (const message of messages) {
              const data = await this.getMessage(message.id!, gmail);
              const parsedMessage = parseMessage(data.data);

              // Extract and structure message data for processing
              const messageData = {
                id: parsedMessage.id,
                threadId: parsedMessage.threadId,
                subject: parsedMessage.headers.subject,
                snippet: parsedMessage.snippet,
                date: parsedMessage.internalDate
                  ? Number(parsedMessage.internalDate)
                  : Date.now(),
                text: parsedMessage.textPlain,
                html: parsedMessage.textHtml,
                to: parseAuthor(parsedMessage.headers.to),
                from: parseAuthor(parsedMessage.headers.from),
                // Redact PII before AI processing for privacy compliance
                redactedText: this.redactor.redact(
                  parsedMessage.textHtml || parsedMessage.textPlain,
                ),
              };

              // Skip if annotation already exists for this message
              if (
                !annotations?.some(
                  (annotation) => annotation.source_id === messageData.id,
                )
              ) {
                // Invoke AI analysis using LangChain prompt
                const chain = this.annotatePrompt.pipe(this.llm);
                const response = await chain.invoke({
                  content: convert(messageData.redactedText), // Convert HTML to plain text
                  sender: messageData.from,
                });

                // Validate AI response structure
                if (!response?.annotation || !response?.sender) {
                  this.logger.warn(
                    `Invalid annotation response for email ${messageData.from.name}:`,
                    response,
                  );
                  continue;
                }

                // Structure sender information from AI response
                const sender = {
                  name: messageData.from.name,
                  email: messageData.from.email,
                  relationship: response?.sender.category,
                  organization: response?.sender.organization,
                };

                // Save or update recipient profile
                const recipient = await this.saveRecipient(sender, userId);
                
                // Save annotation with validated data
                const annotation = await this.saveAnnotation(
                  messageData,
                  recipient,
                  response.annotation,
                  userId,
                );
                results.push(annotation);
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `Error fetching thread ${threadId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return results;
    } catch (error) {
      this.logger.error(`Failed to process threads: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Extract communication style patterns from email content
   * 
   * Analyzes message content to identify:
   * - Writing style and tone patterns
   * - Communication preferences
   * - Formality levels
   * - Key phrases and vocabulary
   * 
   * This method is used by the EmbeddingsService for style pattern analysis.
   * 
   * @param message - Email message content to analyze
   * @returns Promise resolving to extracted style patterns object
   * 
   * @example
   * ```typescript
   * const patterns = await agentsService.extractPatterns(
   *   "Thanks for your email. I'll get back to you soon!"
   * );
   * console.log(patterns.tone); // e.g., 'FRIENDLY'
   * console.log(patterns.formality); // e.g., 'CASUAL'
   * ```
   * 
   * @throws Re-throws any AI service errors for handling by caller
   */
  async extractPatterns(message: string): Promise<any> {
    const chain = this.patternsPrompt.pipe(this.llm);

    try {
      const response = await chain.invoke({
        message: message,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save or update recipient information in the database
   * 
   * Validates relationship types against database enums and performs upsert
   * operation to avoid duplicates. Unknown relationship types are set to 'UNKNOWN'.
   * 
   * @param sender - Sender information extracted from email
   * @param userId - User ID for data ownership
   * @returns Promise resolving to saved recipient record
   * @private
   */
  private async saveRecipient(sender: any, userId: string): Promise<any> {
    const { data: relationships } = await this.supabase.rpc('get_types', {
      enum_type: 'relationship',
    });

    const relationship = relationships.includes(sender.relationship)
      ? sender.relationship
      : 'UNKNOWN';

    const { data, error } = await this.supabase
      .from('recipients')
      .upsert(
        {
          user_id: userId,
          name: sender.name,
          email: sender.email,
          relationship: relationship,
          organization: sender.organization,
        },
        {
          onConflict: 'email,user_id',
        },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to save recipient ${sender.email}:`, error);
    }

    return data;
  }

  /**
   * Save email annotation with validated enum values
   * 
   * Validates tone, purpose, and sentiment against database enum types.
   * Invalid values are defaulted to 'UNKNOWN' to maintain data consistency.
   * Performs upsert operation using source_id as conflict resolution.
   * 
   * @param email - Parsed email data with content and metadata
   * @param recipient - Associated recipient record
   * @param annotation - AI-generated annotation data
   * @param userId - User ID for data ownership
   * @returns Promise resolving to saved annotation record
   * @private
   */
  private async saveAnnotation(
    email: any,
    recipient: any,
    annotation: any,
    userId: string,
  ): Promise<any> {
    if (!annotation) {
      this.logger.warn(`Missing annotation for message ${recipient}`);
      return null;
    }

    const { data: toneOptions } = await this.supabase.rpc('get_types', {
      enum_type: 'tone',
    });

    const { data: purposeOptions } = await this.supabase.rpc('get_types', {
      enum_type: 'purpose',
    });

    const { data: sentimentOptions } = await this.supabase.rpc('get_types', {
      enum_type: 'sentiment',
    });

    const tone =
      annotation.tone && toneOptions.includes(annotation.tone)
        ? annotation.tone
        : 'UNKNOWN';

    const purpose =
      annotation.purpose && purposeOptions.includes(annotation.purpose)
        ? annotation.purpose
        : 'UNKNOWN';

    const sentiment =
      annotation.sentiment && sentimentOptions.includes(annotation.sentiment)
        ? annotation.sentiment
        : 'UNKNOWN';

    const { data, error } = await this.supabase
      .from('annotations')
      .upsert(
        {
          tone: tone,
          user_id: userId,
          purpose: purpose,
          source_id: email.id,
          sentiment: sentiment,
          thread_id: email.threadId,
          recipient_id: recipient.id,
          context: annotation?.context,
          content: convert(email.redactedText),
        },
        {
          onConflict: 'source_id',
        },
      )
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to save annotation for recipient ${recipient}`,
        error,
      );
    }
    return data;
  }
}
