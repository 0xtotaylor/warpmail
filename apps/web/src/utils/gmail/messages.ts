import type { gmail_v1 } from "@googleapis/gmail";

export async function getMessages(
  gmail: gmail_v1.Gmail,
  options: {
    query?: string;
    maxResults?: number;
    pageToken?: string;
  }
) {
  const messages = await gmail.users.messages.list({
    userId: "me",
    maxResults: options.maxResults,
    q: options.query,
    pageToken: options.pageToken,
  });

  return messages.data;
}
