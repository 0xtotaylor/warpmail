export type ComposeData = {
  template?: string;
  subject?: string;
  recipient?: { name?: string; email?: string; url?: string };
};

export type EmailContext = {
  recipient: {
    name: string;
    relationship: string;
    organization: string;
    cultural_background: string | null;
  };
  communication_style: {
    tones: string[];
    greetings: string[];
    closings: string[];
    formalityLevel: string;
    averageLength: number;
  };
  similar_messages: Array<{
    thread_id: string;
    context: string;
    style_patterns: {
      signoffs: string[];
      greetings: string[];
      commonPhrases: string[];
      emotionalMarkers: string[];
      sentenceStructures: string[];
      formalityIndicators: string[];
    };
    message_count: number;
    last_message_date: string;
    similarity: number;
  }>;
  success_metrics: {
    averageResponseTime: string;
    sentimentTrend: string;
    commonTopics: string[];
  };
};

export type Channel = {
  id: string;
  created_at: string;
  name: string | null;
  description: string | null;
};

export type Annotation = {
  id: string;
  created_at: string;
  message_id: string;
  tone: string | null;
  sentiment: string | null;
  context: string | null;
  purpose: string | null;
};
