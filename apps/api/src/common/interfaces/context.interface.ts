/**
 * Communication Context Interfaces
 * 
 * Defines TypeScript interfaces for context analysis and communication patterns.
 * Used by ContextService and related services for type safety and documentation.
 */

/**
 * Sender/Recipient information structure
 */
export interface RecipientInfo {
  /** Recipient's display name */
  name: string;
  /** Recipient's email address */
  email: string;
  /** Relationship category (e.g., COLLEAGUE, CLIENT, VENDOR) */
  relationship?: string;
  /** Organization name if available */
  organization?: string;
}

/**
 * Communication pattern analysis results
 * Extracted from historical interactions to understand communication style
 */
export interface CommunicationPatterns {
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
    /** Primary emotional tone */
    primary: string;
    /** Secondary emotional tones */
    secondary: string[];
    /** Specific emotional markers found in text */
    markers: string[];
  };
  /** Formality level indicators */
  formalityIndicators: {
    /** Overall formality level (FORMAL, SEMI_FORMAL, CASUAL) */
    level: string;
    /** Specific formality markers found in text */
    markers: string[];
  };
  /** Vocabulary complexity and preferences */
  vocabularyProfile: {
    /** Vocabulary complexity level (SIMPLE, MODERATE, COMPLEX) */
    complexity: string;
    /** Specialized or technical terms used */
    specializedTerms: string[];
    /** Preferred vocabulary and phrases */
    preferences: string[];
  };
  /** Average message length in words */
  averageLength: number;
}

/**
 * Communication success metrics
 * Calculated from historical interaction outcomes
 */
export interface SuccessMetrics {
  /** Average response time for this recipient */
  averageResponseTime: string;
  /** Overall sentiment trend in conversations */
  sentimentTrend: 'positive' | 'neutral' | 'negative';
  /** Common topics discussed with this recipient */
  commonTopics: string[];
}

/**
 * Similar message match from vector search
 */
export interface SimilarMessage {
  /** Message ID */
  id: string;
  /** Message content excerpt */
  content: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** Message tone */
  tone: string;
  /** Message purpose */
  purpose: string;
  /** Message sentiment */
  sentiment: string;
  /** When the message was sent */
  created_at: string;
}

/**
 * Complete communication context response
 * Returned by ContextService.getContext()
 */
export interface CommunicationContext {
  /** Recipient profile information */
  recipient: RecipientInfo & {
    /** Database record ID */
    id: string;
    /** User ID who owns this recipient */
    user_id: string;
    /** When the recipient was first added */
    created_at: string;
    /** Last update timestamp */
    updated_at: string;
  };
  /** Analyzed communication style patterns */
  communication_style: CommunicationPatterns;
  /** Vector-matched similar messages for context */
  similar_messages: SimilarMessage[];
  /** Communication effectiveness metrics */
  success_metrics: SuccessMetrics;
}

/**
 * Context generation parameters
 */
export interface ContextGenerationParams {
  /** Recipient information */
  recipient: RecipientInfo;
  /** Communication patterns analysis */
  patterns: CommunicationPatterns;
  /** Current message content for context */
  message: string;
}