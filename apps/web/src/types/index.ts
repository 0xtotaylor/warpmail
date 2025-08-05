export * from "./gmail";
export * from "./supabase";

export enum FolderType {
  inbox = "inbox",
  sent = "sent",
  trash = "trash",
  spam = "spam",
  archive = "archive",
  important = "important",
  drafts = "drafts",
  starred = "starred",
  unread = "unread",
}

export type ComposeData = {
  template?: string;
  subject?: string;
  from?: { name?: string; email?: string; url?: string };
};

export type ResponseOption = {
  title: string;
  description: string;
  template: string;
};

export type EmailBodyProps = {
  defaultValue?: string;
  value: string;
  originalValue: string | null;
  onChange: (value: string) => void;
  improvedContent?: string | null;
};

export type EmailActionResponse = {
  error?: string;
  previous?: {
    recipientEmail?: string;
    subject?: string;
    body?: string;
  };
};
