import type { gmail_v1 } from "@googleapis/gmail";

import { type MessageWithPayload } from "@/types";

export async function getMessage(
  messageId: string,
  gmail: gmail_v1.Gmail,
  format?: "full" | "metadata"
): Promise<MessageWithPayload> {
  const message = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format,
  });

  return message.data as MessageWithPayload;
}
