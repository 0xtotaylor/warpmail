import { NextResponse } from "next/server";
import parse from "gmail-api-parse-message";

import { getMessage } from "@/utils/gmail/message";
import { getRedisClient } from "@/utils/redis/client";
import { getGmailClient } from "@/utils/gmail/client";
import { auth } from "@/app/api/auth/[...nextauth]/auth";

const redis = getRedisClient();
const CACHE_EXPIRATION = 60 * 5;

export type MessagesResponse = Awaited<ReturnType<typeof getMessages>>;

async function getMessages() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cacheKey = `gmail:messages:${session.user?.id}`;
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    return { messages: JSON.parse(cachedData) };
  }

  const gmail = getGmailClient(session);

  const messages = await gmail.users.messages.list({
    userId: "me",
    maxResults: process.env.NODE_ENV === "development" ? 50 : 500,
  });

  const fullMessages = await Promise.all(
    (messages.data.messages || []).map(async (m) => {
      const message = await getMessage(m.id!, gmail);
      return parse(message);
    })
  );

  await redis.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(fullMessages));

  return { messages: fullMessages };
}

export async function GET() {
  const result = await getMessages();
  return NextResponse.json(result);
}
