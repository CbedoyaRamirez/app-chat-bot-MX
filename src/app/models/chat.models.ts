// Bot Type Enum
export enum BotType {
  QUOTE_AUTO = 'quote-auto',
  FAQ = 'faq-bot'
}

// Bot Configuration Interface
export interface BotConfig {
  botId: BotType;
  title: string;
  welcomeMessage: string;
  avatar: string;
  theme: string;
}

// Chat Request and Response Models
export interface ChatRequest {
  sessionId: string;
  botId: string;
  message: string;
}

export interface ChatResponse {
  sessionId: string;
  botId: string;
  response: string;
  isComplete: boolean;
  metadata?: Record<string, any>;
}

// Speech Recognition Models
export interface SpeechToTextRequest {
  audioBase64: string;
  audioFormat: string;
  language?: string;
  sampleRate?: number;
}

export interface SpeechToTextResponse {
  text: string;
  success: boolean;
  confidence?: number;
  durationSeconds?: number;
  detectedLanguage?: string;
  errorMessage?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: string;
  audioFormat?: string;
  language?: string;
  speechRate?: number;
}

export interface TextToSpeechResponse {
  audioBase64: string;
  audioFormat: string;
  success: boolean;
  audioSizeBytes: number;
  durationSeconds?: number;
  errorMessage?: string;
}

// UI Message Models (for custom chat component)
export interface Message {
  message: string;
  messageType: 'text' | 'link' | 'input';
  fromUser?: boolean;
  timestamp?: Date;
  transferNotifyMessage?: string;
  errorState?: boolean;
  linkConfig?: {
    link: string;
    message: string;
    label: string;
  };
  inputConfig?: {
    message: string;
    options: string[];
  };
}

export interface UserMessageEvent {
  userMessage: string;
  messages: Message[];
}

export interface ModalConfig {
  typeVariant: 'destructive' | 'default';
  title: string;
  description: string;
  primaryButtonLabel: string;
  secondaryButtonLabel: string;
  transcript?: {
    label: string;
    rightIconKey: string;
    leftIconKey: string;
    linkConfiguration: any;
  };
}
