"use client";

import DOMPurify from "isomorphic-dompurify";

import { Message } from "@/types";
import { formatDate } from "@/lib/utils";
import { ResponseOptionsDialog } from "@/components/response-options-dialog";

export function Inbox({ email }: { email: Message }) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{email.subject}</h1>
        {(email.folder === "inbox" || email.folder === "drafts") &&
          email.from && (
            <ResponseOptionsDialog
              emailContent={email.text || email.snippet}
              senderName={email.from.name || ""}
              subject={email.subject}
              from={email.from}
              folder={email.folder}
            />
          )}
      </div>
      <p>
        From: {email?.from?.name} ({email?.from?.email})
      </p>
      <p>Date: {formatDate(email.date)}</p>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.html) }}
      />
    </div>
  );
}
