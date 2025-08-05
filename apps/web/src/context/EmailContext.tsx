"use client";

import useSWR from "swr";
import parseAuthor from "parse-author";
import * as Sentry from "@sentry/nextjs";
import { useSession } from "next-auth/react";
import { createContext, useState, useContext } from "react";

import { ComposeData, Message, ParsedMessage } from "@/types";

const FOLDERS = {
  INBOX: "inbox",
  DRAFTS: "drafts",
  SENT: "sent",
  TRASH: "trash",
} as const;

interface EmailContextType {
  emails: Message[] | null;
  composeData: ComposeData;
  searchEmails: (searchTerm: string, folder: string) => Message[];
  setComposeData: (data: ComposeData) => void;
  clearComposeData: () => void;
  getEmailsByFolder: (folder: string) => Message[];
}

export const EmailContext = createContext<EmailContextType>({
  emails: null,
  composeData: {},
  searchEmails: () => [],
  setComposeData: () => {},
  clearComposeData: () => {},
  getEmailsByFolder: () => [],
});

export function EmailProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [composeData, setComposeData] = useState<ComposeData>({});

  const clearComposeData = () => setComposeData({});

  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch emails");
    }
    return response.json();
  };

  const { data } = useSWR<{ messages: ParsedMessage[] }>(
    session?.accessToken ? `/api/gmail/messages` : null,
    fetcher,
    {
      onError: (error) => Sentry.captureException(error),
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const emails: Message[] | null = data?.messages
    ? data.messages.map((message: ParsedMessage) => {
        const from = parseAuthor(message.headers.from);

        const folder =
          (message.labelIds
            ?.find((label) =>
              Object.values(FOLDERS).includes(
                label.toLowerCase() as (typeof FOLDERS)[keyof typeof FOLDERS]
              )
            )
            ?.toLowerCase() as (typeof FOLDERS)[keyof typeof FOLDERS]) ||
          message.labelIds?.[0]?.toLowerCase() ||
          FOLDERS.INBOX;

        return {
          id: message.id,
          threadId: message.threadId,
          subject: message.headers.subject || "",
          snippet: message.snippet || "",
          folder,
          date: message.internalDate
            ? Number(message.internalDate)
            : Date.now(),
          text: message.textPlain || "",
          html: message.textHtml || "",
          from: {
            name: from.name || "",
            email: from.email || "",
          },
          to: message.headers.to || "",
        };
      })
    : null;

  const getEmailsByFolder = (folder: string) => {
    if (!emails) return [];
    return emails.filter((email) => email.folder === folder);
  };

  const searchEmails = (searchTerm: string, folder: string) => {
    if (!emails) return [];
    return emails.filter((email) => {
      const matchesFolder = email.folder === folder;
      const lowerTerm = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        email.subject.toLowerCase().includes(lowerTerm) ||
        email.text.toLowerCase().includes(lowerTerm) ||
        email.from.name.toLowerCase().includes(lowerTerm) ||
        email.from.email.toLowerCase().includes(lowerTerm);

      return matchesFolder && matchesSearch;
    });
  };

  return (
    <EmailContext.Provider
      value={{
        emails,
        composeData,
        searchEmails,
        setComposeData,
        clearComposeData,
        getEmailsByFolder,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmails() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error("useEmails must be used within an EmailProvider");
  }
  return context;
}
