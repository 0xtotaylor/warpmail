export interface EmailContext {
  senderHistory: {
    commonPhrases: string[];
    greetingStyles: string[];
    signoffStyles: string[];
    formalityLevel: string;
    emotionalTone: string;
    vocabulary: string[];
  };
  recipientHistory: {
    previousInteractions: {
      date: string;
      summary: string;
      tone: string;
      success_metrics: {
        response_time: number;
        sentiment: string;
      };
    }[];
    communicationPreferences: {
      preferred_formality: string;
      response_patterns: string;
      cultural_preferences: string[];
    };
    relationship: {
      type: string;
      duration: string;
      last_interaction: string;
      project_context: string[];
    };
  };
  relationshipDynamics: {
    hierarchy: string;
    collaboration_history: string[];
    team_context: string;
    organizational_culture: string;
  };
}
