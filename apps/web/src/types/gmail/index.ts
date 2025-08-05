import type { gmail_v1 } from "@googleapis/gmail";

export type GmailConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
};

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export type MessageWithPayload = gmail_v1.Schema$Message & {
  payload: gmail_v1.Schema$MessagePart;
};

export interface ParsedMessage extends gmail_v1.Schema$Message {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId: string;
  attachments?: Attachment[];
  inline: Inline[];
  headers: ParsedMessageHeaders;
  textPlain?: string;
  textHtml?: string;
}

export interface Attachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  headers: Headers;
}

interface Headers {
  "content-type": string;
  "content-description": string;
  "content-transfer-encoding": string;
  "content-id": string;
}

interface Inline {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  headers: Headers2;
}

interface Headers2 {
  "content-type": string;
  "content-description": string;
  "content-transfer-encoding": string;
  "content-id": string;
}

export interface ParsedMessageHeaders {
  subject: string;
  from: string;
  to: string;
  cc?: string;
  date: string;
  "message-id"?: string;
  "reply-to"?: string;
  references?: string;
  "list-unsubscribe"?: string;
}

export type Message = {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  folder: string;
  date: number;
  text: string;
  html: string;
  from: From;
  to: string;
};

export type From = {
  name: string;
  email: string;
};

export type ThreadWithPayloadMessages = gmail_v1.Schema$Thread & {
  messages: MessageWithPayload[];
};
