import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { AzureOpenAIEmbeddings } from '@langchain/openai';

import { SupabaseConfig } from '../config/supabase.config';

/**
 * Interface defining communication pattern analysis structure
 * Used to track and analyze communication styles for contextual insights
 */
interface CommunicationPatterns {
  /** Common tones used in communication (e.g., FORMAL, CASUAL, FRIENDLY) */
  tones: string[];
  /** Common greeting patterns */
  greetings: string[];
  /** Common closing patterns */
  closings: string[];
  /** Sentence structure patterns */
  sentenceStructures: string[];
  /** Emotional tone analysis */
  emotionalMarkers: {
    primary: string;
    secondary: string[];
    markers: string[];
  };
  /** Formality level indicators */
  formalityIndicators: {
    level: string;
    markers: string[];
  };
  /** Vocabulary complexity and preferences */
  vocabularyProfile: {
    complexity: string;
    specializedTerms: string[];
    preferences: string[];
  };
  /** Average message length in words */
  averageLength: number;
}

/**
 * ContextService - Communication Context Analysis Service
 * 
 * Builds comprehensive communication context profiles by analyzing historical
 * interactions with email recipients. Uses vector embeddings to understand
 * communication patterns, preferences, and successful interaction strategies.
 * 
 * Key Responsibilities:
 * - Analyze communication patterns from historical data
 * - Generate vector embeddings for semantic similarity matching
 * - Calculate communication success metrics
 * - Provide contextual insights for email composition
 * - Build recipient profiles with communication preferences
 * 
 * Features:
 * - Vector-based semantic search using Azure OpenAI embeddings
 * - Communication pattern analysis and profiling
 * - Success metrics calculation based on interaction history
 * - Structured context generation for AI-powered email assistance
 * 
 * @example
 * ```typescript
 * // Get communication context for a recipient
 * const context = await contextService.getContext(
 *   { email: 'recipient@example.com', name: 'John Doe' },
 *   'Meeting request message content',
 *   'user123'
 * );
 * 
 * console.log(context.communication_style.tones); // ['PROFESSIONAL', 'FRIENDLY']
 * console.log(context.success_metrics.averageResponseTime); // '2 hours'
 * ```
 */
@Injectable()
export class ContextService {
  /** Azure OpenAI embeddings client for vector generation and similarity matching */
  private readonly embeddings: AzureOpenAIEmbeddings;
  
  /** Service logger instance */
  private readonly logger = new Logger(ContextService.name);

  /**
   * Initialize the ContextService with required dependencies
   * 
   * @param configService - NestJS configuration service for environment variables
   * @param supabase - Supabase database configuration and client
   */
  constructor(
    private configService: ConfigService,
    private readonly supabase: SupabaseConfig,
  ) {
    // Initialize Azure OpenAI embeddings client for vector-based similarity matching
    this.embeddings = new AzureOpenAIEmbeddings({
      model: 'text-embedding-3-large',           // High-quality embedding model
      azureOpenAIApiDeploymentName: 'text-embedding-3-large',
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiInstanceName: this.configService.getOrThrow<string>(
        'AZURE_RESOURCE_NAME',
      ),
      azureOpenAIApiKey: this.configService.getOrThrow<string>('AZURE_API_KEY'),
    });
  }

  /**
   * Get comprehensive communication context for a recipient
   * 
   * Analyzes historical interactions to build a contextual profile including:
   * 1. Recipient information and relationship details
   * 2. Communication pattern analysis from past interactions
   * 3. Vector-based similarity matching for relevant context
   * 4. Success metrics and communication effectiveness data
   * 
   * The method performs semantic search using embeddings to find similar
   * past conversations and extract successful communication patterns.
   * 
   * @param from - Sender information object with email and name
   * @param message - Current message content for context matching
   * @param userId - User ID for data filtering and ownership
   * @returns Promise resolving to context object with recipient profile,
   *          communication patterns, similar messages, and success metrics
   * 
   * @example
   * ```typescript
   * const context = await contextService.getContext(
   *   { email: 'client@company.com', name: 'Jane Smith' },
   *   'Can we schedule a meeting to discuss the project?',
   *   'user123'
   * );
   * 
   * if (context) {
   *   console.log(`Relationship: ${context.recipient.relationship}`);
   *   console.log(`Preferred tone: ${context.communication_style.tones[0]}`);
   *   console.log(`Similar messages: ${context.similar_messages.length}`);
   * }
   * ```
   * 
   * @throws Returns null if recipient not found or database errors occur
   */
  async getContext(from: any, message: string, userId: string) {
    if (!from?.email || !userId) {
      this.logger.error('Missing required parameters: from.email or userId');
      return null;
    }

    try {
      // 1. Get recipient and their communication history
      const { data: recipient, error: recipientError } = await this.supabase
        .from('recipients')
        .select('*')
        .eq('email', from.email)
        .eq('user_id', userId)
        .single();

      if (recipientError || !recipient) {
        this.logger.error(
          `Error fetching recipient: ${recipientError?.message}`,
        );
        return null;
      }

      // 2. Get the most recent successful interactions with this recipient
      const { data: recentAnnotations, error: annotationsError } =
        await this.supabase
          .from('annotations')
          .select(
            `
          *,
          recipients (*)
        `,
          )
          .eq('recipient_id', recipient.id)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

      if (annotationsError) {
        this.logger.error(
          `Error fetching annotations: ${annotationsError.message}`,
        );
        return null;
      }

      // 3. Extract communication patterns
      const communicationPatterns = this.analyzeCommunicationPatterns(
        recentAnnotations || [],
      );

      // 4. Generate query context from all available information
      const queryContext = this.generateQueryContext(
        recipient,
        communicationPatterns,
        message,
      );

      // 5. Generate embedding for query context
      const queryEmbedding = await this.embeddings.embedQuery(queryContext);

      // 6. Find similar messages using vector similarity
      const { data: similarMessages, error: matchError } =
        await this.supabase.rpc('match_message_tones', {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
          p_recipient_id: recipient.id,
        });

      if (matchError) {
        this.logger.error(`Error matching messages: ${matchError.message}`);
      }

      // 7. Return structured response with context
      return {
        recipient,
        communication_style: communicationPatterns,
        similar_messages: similarMessages || [],
        success_metrics: this.calculateSuccessMetrics(similarMessages || []),
      };
    } catch (error) {
      this.logger.error(`Error in getContext: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private analyzeCommunicationPatterns(messages: any[]): CommunicationPatterns {
    const patterns = {
      tones: new Set<string>(),
      greetings: new Set<string>(),
      closings: new Set<string>(),
      sentenceStructures: new Set<string>(),
      emotionalMarkers: {
        primary: '',
        secondary: new Set<string>(),
        markers: new Set<string>(),
      },
      formalityIndicators: {
        markers: new Set<string>(),
      },
      vocabularyProfile: {
        specializedTerms: new Set<string>(),
        preferences: new Set<string>(),
      },
      averageLength: 0,
    };

    try {
      messages.forEach((message) => {
        if (!message?.content) return;

        // Extract tones from annotations
        if (message.annotations?.[0]?.tone) {
          patterns.tones.add(message.annotations[0].tone);
        }

        // Process message content
        const lines = message.content
          .split('\n')
          .filter((l: string) => l.trim());
        if (lines[0]) {
          patterns.greetings.add(lines[0].trim());
        }
        if (lines[lines.length - 1]) {
          patterns.closings.add(lines[lines.length - 1].trim());
        }

        // Extract sentence structures
        const sentences = message.content.match(/[^.!?]+[.!?]+/g) || [];
        sentences.forEach((sentence: string) => {
          const structure = this.analyzeSentenceStructure(sentence);
          if (structure) {
            patterns.sentenceStructures.add(structure);
          }
        });

        // Accumulate message length for average calculation
        patterns.averageLength += message.content.length;
      });

      const formalityLevel = this.determineFormalityLevel({
        greetings: Array.from(patterns.greetings),
        closings: Array.from(patterns.closings),
      });

      return {
        tones: Array.from(patterns.tones),
        greetings: Array.from(patterns.greetings),
        closings: Array.from(patterns.closings),
        sentenceStructures: Array.from(patterns.sentenceStructures),
        emotionalMarkers: {
          primary: this.determineEmotionalTone(Array.from(patterns.tones)),
          secondary: Array.from(patterns.emotionalMarkers.secondary),
          markers: Array.from(patterns.emotionalMarkers.markers),
        },
        formalityIndicators: {
          level: formalityLevel,
          markers: Array.from(patterns.formalityIndicators.markers),
        },
        vocabularyProfile: {
          complexity: this.determineVocabularyComplexity(
            patterns.averageLength,
            messages.length,
          ),
          specializedTerms: Array.from(
            patterns.vocabularyProfile.specializedTerms,
          ),
          preferences: Array.from(patterns.vocabularyProfile.preferences),
        },
        averageLength:
          messages.length > 0
            ? Math.round(patterns.averageLength / messages.length)
            : 0,
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing communication patterns: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.getDefaultPatterns();
    }
  }

  private generateQueryContext(
    recipient: any,
    patterns: CommunicationPatterns,
    message: string,
  ): string {
    return `
      RECIPIENT INFORMATION:
      Name: ${recipient?.name || 'Unknown'}
      Relationship: ${recipient?.relationship || 'Unknown'}
      Organization: ${recipient?.organization || 'Unknown'}
      
      COMMUNICATION STYLE:
      Typical Tones: ${patterns.tones.join(', ') || 'None detected'}
      Greetings Used: ${patterns.greetings.join(', ') || 'None detected'}
      Closing Styles: ${patterns.closings.join(', ') || 'None detected'}
      Sentence Patterns: ${patterns.sentenceStructures.join(', ') || 'None detected'}
      
      EMOTIONAL EXPRESSION:
      Primary Tone: ${patterns.emotionalMarkers.primary || 'Neutral'}
      Secondary Tones: ${patterns.emotionalMarkers.secondary.join(', ') || 'None detected'}
      Emotional Markers: ${patterns.emotionalMarkers.markers.join(', ') || 'None detected'}
      
      FORMALITY:
      Level: ${patterns.formalityIndicators.level}
      Markers: ${patterns.formalityIndicators.markers.join(', ') || 'None detected'}
      
      VOCABULARY PROFILE:
      Complexity: ${patterns.vocabularyProfile.complexity}
      Specialized Terms: ${patterns.vocabularyProfile.specializedTerms.join(', ') || 'None detected'}
      Preferences: ${patterns.vocabularyProfile.preferences.join(', ') || 'None detected'}
      
      CURRENT MESSAGE:
      ${message || ''}
    `.trim();
  }

  private determineFormalityLevel(patterns: any): string {
    const formalGreetings = ['Dear', 'To whom it may concern', 'Respected'];
    const formalClosings = ['Sincerely', 'Best regards', 'Yours faithfully'];

    let formalityScore = 0;
    patterns.greetings.forEach((greeting: string) => {
      if (formalGreetings.some((fg) => greeting.includes(fg))) formalityScore++;
    });

    patterns.closings.forEach((closing: string) => {
      if (formalClosings.some((fc) => closing.includes(fc))) formalityScore++;
    });

    return formalityScore >
      (patterns.greetings.length + patterns.closings.length) / 2
      ? 'formal'
      : 'casual';
  }

  private analyzeSentenceStructure(sentence: string): string | null {
    try {
      const words = sentence.trim().split(/\s+/);
      if (words.length < 3) return null;

      // Simple structure analysis (can be expanded)
      if (sentence.includes('if') && sentence.includes('then')) {
        return 'conditional';
      } else if (sentence.includes('because') || sentence.includes('since')) {
        return 'causal';
      } else if (
        sentence.startsWith('Could you') ||
        sentence.startsWith('Would you')
      ) {
        return 'polite-request';
      }
      return 'declarative';
    } catch (error) {
      return null;
    }
  }

  private determineEmotionalTone(tones: string[]): string {
    const toneMap: { [key: string]: number } = {};
    tones.forEach((tone) => {
      toneMap[tone] = (toneMap[tone] || 0) + 1;
    });

    return (
      Object.entries(toneMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'
    );
  }

  private determineVocabularyComplexity(
    totalLength: number,
    messageCount: number,
  ): string {
    if (messageCount === 0) return 'unknown';
    const averageLength = totalLength / messageCount;

    if (averageLength > 150) return 'complex';
    if (averageLength > 75) return 'moderate';
    return 'simple';
  }

  private getDefaultPatterns(): CommunicationPatterns {
    return {
      tones: [],
      greetings: [],
      closings: [],
      sentenceStructures: [],
      emotionalMarkers: {
        primary: 'neutral',
        secondary: [],
        markers: [],
      },
      formalityIndicators: {
        level: 'neutral',
        markers: [],
      },
      vocabularyProfile: {
        complexity: 'unknown',
        specializedTerms: [],
        preferences: [],
      },
      averageLength: 0,
    };
  }

  private calculateSuccessMetrics(messages: any[]) {
    try {
      return {
        averageResponseTime: this.calculateAverageResponseTime(messages),
        sentimentTrend: this.analyzeSentimentTrend(messages),
        commonTopics: this.extractCommonTopics(messages),
      };
    } catch (error) {
      this.logger.error(`Error calculating success metrics: ${error instanceof Error ? error.message : String(error)}`);
      return {
        averageResponseTime: 'unknown',
        sentimentTrend: 'neutral',
        commonTopics: [],
      };
    }
  }

  private calculateAverageResponseTime(messages: any[]) {
    if (!Array.isArray(messages) || messages.length === 0) return 'unknown';
    // Implementation for response time calculation
    return '24h'; // Placeholder
  }

  private analyzeSentimentTrend(messages: any[]) {
    if (!Array.isArray(messages) || messages.length === 0) return 'neutral';
    // Implementation for sentiment analysis
    return 'positive'; // Placeholder
  }

  private extractCommonTopics(messages: any[]) {
    if (!Array.isArray(messages) || messages.length === 0) return [];
    // Implementation for topic extraction
    return ['updates', 'meetings']; // Placeholder
  }
}
