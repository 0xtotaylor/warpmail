import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { AzureOpenAIEmbeddings } from '@langchain/openai';

import { formatDate } from '../common/utils';
import { AgentsService } from '../agents/agents.service';
import { SupabaseConfig } from '../config/supabase.config';

@Injectable()
export class EmbeddingsService {
  private readonly embeddings: AzureOpenAIEmbeddings;
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private configService: ConfigService,
    private readonly supabase: SupabaseConfig,
    private readonly agentsService: AgentsService,
  ) {
    this.embeddings = new AzureOpenAIEmbeddings({
      model: 'text-embedding-3-large',
      azureOpenAIApiDeploymentName: 'text-embedding-3-large',
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiInstanceName: this.configService.getOrThrow<string>(
        'AZURE_RESOURCE_NAME',
      ),
      azureOpenAIApiKey: this.configService.getOrThrow<string>('AZURE_API_KEY'),
    });
  }

  private async getThreadAnnotations(threadId: string, userId: string) {
    if (!threadId || !userId) {
      this.logger.error('ThreadId or userId is missing');
      return [];
    }

    const { data: annotations, error } = await this.supabase
      .from('annotations')
      .select(
        `
        *,
        recipients (*)
      `,
      )
      .eq('thread_id', threadId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Failed to get thread annotations: ${error.message}`);
      return [];
    }

    return annotations || [];
  }

  private async extractStylePatterns(messages: any[]): Promise<any> {
    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        greetings: [],
        signoffs: [],
        commonPhrases: [],
        sentenceStructures: [],
        emotionalMarkers: {
          primary: '',
          secondary: [],
          markers: [],
        },
        formalityIndicators: {
          level: '',
          markers: [],
        },
        vocabularyProfile: {
          complexity: '',
          specializedTerms: [],
          preferences: [],
        },
      };
    }

    const patterns = {
      greetings: new Set<string>(),
      signoffs: new Set<string>(),
      commonPhrases: new Set<string>(),
      sentenceStructures: new Set<string>(),
      emotionalMarkers: {
        primary: '',
        secondary: new Set<string>(),
        markers: new Set<string>(),
      },
      formalityIndicators: {
        level: '',
        markers: new Set<string>(),
      },
      vocabularyProfile: {
        complexity: '',
        specializedTerms: new Set<string>(),
        preferences: new Set<string>(),
      },
    };

    const MAX_RETRIES = 3;
    const BASE_DELAY = 8000; // 8 seconds based on error message

    for (const message of messages) {
      let retryCount = 0;
      let lastError = null;

      while (retryCount < MAX_RETRIES) {
        try {
          const stylePatterns =
            await this.agentsService.extractPatterns(message);

          if (!stylePatterns) {
            break;
          }

          // Handle greetings
          if (Array.isArray(stylePatterns.greetings)) {
            stylePatterns.greetings.forEach((g) => patterns.greetings.add(g));
          }

          // Handle signoffs
          if (Array.isArray(stylePatterns.signoffs)) {
            stylePatterns.signoffs.forEach((s) => patterns.signoffs.add(s));
          }

          // Handle common phrases
          if (Array.isArray(stylePatterns.commonPhrases)) {
            stylePatterns.commonPhrases.forEach((p) =>
              patterns.commonPhrases.add(p),
            );
          }

          // Handle sentence structures
          if (Array.isArray(stylePatterns.sentenceStructures)) {
            stylePatterns.sentenceStructures.forEach((s) =>
              patterns.sentenceStructures.add(s),
            );
          }

          // Handle emotional markers
          if (stylePatterns.emotionalMarkers) {
            // Set primary emotion if not already set or if new one is provided
            if (
              stylePatterns.emotionalMarkers.primary &&
              (!patterns.emotionalMarkers.primary ||
                patterns.emotionalMarkers.primary === 'neutral')
            ) {
              patterns.emotionalMarkers.primary =
                stylePatterns.emotionalMarkers.primary;
            }

            // Add secondary emotions
            if (Array.isArray(stylePatterns.emotionalMarkers.secondary)) {
              stylePatterns.emotionalMarkers.secondary.forEach((m) =>
                patterns.emotionalMarkers.secondary.add(m),
              );
            }

            // Add emotional markers
            if (Array.isArray(stylePatterns.emotionalMarkers.markers)) {
              stylePatterns.emotionalMarkers.markers.forEach((m) =>
                patterns.emotionalMarkers.markers.add(m),
              );
            }
          }

          // Handle formality indicators
          if (stylePatterns.formalityIndicators) {
            // Set formality level if not already set
            if (
              stylePatterns.formalityIndicators.level &&
              (!patterns.formalityIndicators.level ||
                patterns.formalityIndicators.level === 'neutral')
            ) {
              patterns.formalityIndicators.level =
                stylePatterns.formalityIndicators.level;
            }

            // Add formality markers
            if (Array.isArray(stylePatterns.formalityIndicators.markers)) {
              stylePatterns.formalityIndicators.markers.forEach((m) =>
                patterns.formalityIndicators.markers.add(m),
              );
            }
          }

          // Handle vocabulary profile
          if (stylePatterns.vocabularyProfile) {
            // Set complexity if not already set
            if (
              stylePatterns.vocabularyProfile.complexity &&
              (!patterns.vocabularyProfile.complexity ||
                patterns.vocabularyProfile.complexity === 'unknown')
            ) {
              patterns.vocabularyProfile.complexity =
                stylePatterns.vocabularyProfile.complexity;
            }

            // Add specialized terms
            if (
              Array.isArray(stylePatterns.vocabularyProfile.specializedTerms)
            ) {
              stylePatterns.vocabularyProfile.specializedTerms.forEach((t) =>
                patterns.vocabularyProfile.specializedTerms.add(t),
              );
            }

            // Add vocabulary preferences
            if (Array.isArray(stylePatterns.vocabularyProfile.preferences)) {
              stylePatterns.vocabularyProfile.preferences.forEach((p) =>
                patterns.vocabularyProfile.preferences.add(p),
              );
            }
          }

          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;

          // Check if it's a rate limit error
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes('429') ||
            errorMessage.includes('rate limit')
          ) {
            retryCount++;

            if (retryCount < MAX_RETRIES) {
              // Exponential backoff with jitter
              const delay =
                BASE_DELAY *
                Math.pow(2, retryCount - 1) *
                (0.5 + Math.random());
              this.logger.warn(
                `OpenAI rate limit hit, attempt ${retryCount}/${MAX_RETRIES}. ` +
                  `Retrying in ${Math.round(delay / 1000)}s...`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
          }

          this.logger.error(
            `Error processing style patterns for message: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          break;
        }
      }

      if (retryCount === MAX_RETRIES) {
        this.logger.error(
          `Failed to process message after ${MAX_RETRIES} retries: ${lastError?.message}`,
        );
      }
    }

    // Convert Sets back to arrays for return value
    return {
      greetings: Array.from(patterns.greetings),
      signoffs: Array.from(patterns.signoffs),
      commonPhrases: Array.from(patterns.commonPhrases),
      sentenceStructures: Array.from(patterns.sentenceStructures),
      emotionalMarkers: {
        primary: patterns.emotionalMarkers.primary || 'neutral',
        secondary: Array.from(patterns.emotionalMarkers.secondary),
        markers: Array.from(patterns.emotionalMarkers.markers),
      },
      formalityIndicators: {
        level: patterns.formalityIndicators.level || 'neutral',
        markers: Array.from(patterns.formalityIndicators.markers),
      },
      vocabularyProfile: {
        complexity: patterns.vocabularyProfile.complexity || 'unknown',
        specializedTerms: Array.from(
          patterns.vocabularyProfile.specializedTerms,
        ),
        preferences: Array.from(patterns.vocabularyProfile.preferences),
      },
    };
  }

  async processThread(
    userId: any,
    message: any,
    recipient: any,
  ): Promise<void> {
    if (!message?.threadId || !userId) {
      this.logger.error('Missing required thread information');
      return;
    }

    try {
      const threadMessages = await this.getThreadAnnotations(
        message.threadId,
        userId,
      );

      const threadContext = await this.createThreadContext(
        threadMessages,
        recipient,
      );

      const stylePatterns = await this.extractStylePatterns(threadMessages);
      const threadEmbedding = await this.embeddings.embedQuery(threadContext);

      const { error } = await this.supabase.from('thread_embeddings').upsert(
        {
          thread_id: message.threadId,
          user_id: userId,
          recipient_id: recipient?.id,
          embedding: threadEmbedding,
          context: threadContext,
          message_count: threadMessages.length,
          last_message_date: formatDate(message.date),
          style_patterns: stylePatterns,
        },
        {
          onConflict: 'thread_id,user_id',
        },
      );

      if (error) {
        this.logger.error(`Error updating thread embedding: ${error.message}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process thread ${message?.threadId}:`,
        error,
      );
    }
  }

  private async createThreadContext(messages: any[], recipient: any) {
    try {
      const stylePatterns = await this.extractStylePatterns(messages);

      const threadContext = `
        COMMUNICATION STYLE:
        Typical Greetings: ${stylePatterns.greetings.join(', ') || 'None'}
        Common Sign-offs: ${stylePatterns.signoffs.join(', ') || 'None'}
        Frequently Used Phrases: ${stylePatterns.commonPhrases.join(', ') || 'None'}
        Sentence Structure Patterns: ${stylePatterns.sentenceStructures.join(', ') || 'None'}
        Emotional Expression: Primary: ${stylePatterns.emotionalMarkers.primary || 'Unknown'}, Secondary: ${stylePatterns.emotionalMarkers.secondary.join(', ') || 'None'}, Markers: ${stylePatterns.emotionalMarkers.markers.join(', ') || 'None'}
        Formality Level: ${stylePatterns.formalityIndicators.level || 'Unknown'}, Markers: ${stylePatterns.formalityIndicators.markers.join(', ') || 'None'}
        Vocabulary Profile: Complexity: ${stylePatterns.vocabularyProfile.complexity || 'Unknown'}, Terms: ${stylePatterns.vocabularyProfile.specializedTerms.join(', ') || 'None'}, Preferences: ${stylePatterns.vocabularyProfile.preferences.join(', ') || 'None'}

        THREAD HISTORY:
        ${messages
          .map(
            (msg) => `
          Date: ${msg.date || 'Unknown'}
          Purpose: ${msg?.[0]?.purpose || 'Unknown'}
          Tone: ${msg?.[0]?.tone || 'Unknown'}
          Key Points: ${msg?.[0]?.context || 'None'}
          Sentiment: ${msg?.[0]?.sentiment || 'Neutral'}
        `,
          )
          .join('\n')}

        RECIPIENT RELATIONSHIP:
        Name: ${recipient?.name || 'Unknown'}
        Relationship Type: ${recipient?.relationship || 'Unknown'}
        Organization: ${recipient?.organization || 'Unknown'}
        Cultural Background: ${recipient?.cultural_background || 'Unknown'}
        Communication History Length: ${messages.length} messages
      `;

      return threadContext;
    } catch (error) {
      this.logger.error('Error creating thread context:', error);
      return '';
    }
  }
}
