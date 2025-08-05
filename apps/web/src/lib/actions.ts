"use server";

import * as hub from "langchain/hub";
import { SyncRedactor } from "redact-pii-light";
import { AzureChatOpenAI } from "@langchain/openai";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { getGmailClient } from "@/utils/gmail/client";
import { createClient } from "@/utils/supabase/client";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import type { ResponseOption, EmailContext, From } from "@/types";

const redactor = new SyncRedactor({
  builtInRedactors: {
    names: {
      enabled: false,
    },
  },
});

const llm = new AzureChatOpenAI({
  model: "gpt-4o",
  azureOpenAIApiVersion: "2024-08-01-preview",
  azureOpenAIApiKey: process.env.AZURE_API_KEY,
  azureOpenAIApiDeploymentName: "warpmail-app-react",
  azureOpenAIApiInstanceName: process.env.AZURE_RESOURCE_NAME,
});

export async function generateResponsesAction(
  emailContent: string,
  senderName: string
) {
  const session = await auth();
  const parser = new JsonOutputParser<ResponseOption[]>();
  const prompt = await hub.pull("warpmail-quick-reply");
  const chain = prompt.pipe(llm).pipe(parser);

  const response = await chain.invoke({
    senderName: senderName,
    emailContent: redactor.redact(emailContent),
    receiverName: session?.user.name,
  });

  return response;
}

export async function improveEmailAction(from: From, emailContent: string) {
  const session = await auth();
  if (!session?.supabaseAccessToken) {
    throw new Error("Not authenticated");
  }

  const supabase = createClient(session?.supabaseAccessToken);

  const { data: recipient } = await supabase
    .from("recipients")
    .select("*")
    .eq("email", from.email)
    .single();

  if (!recipient) {
    const prompt = await hub.pull("warpmail-improve-email");
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({
      fullName: session?.user.name,
      emailContent,
      communicationStyle: "{}",
      recipientContext: "{}",
      threadHistory: "",
      messagePurpose: "GENERAL",
    });

    return response.content;
  }

  const contextResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/context`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.supabaseAccessToken}`,
      },
      body: JSON.stringify({
        from: from,
        message: redactor.redact(emailContent),
      }),
    }
  );

  if (!contextResponse.ok) {
    throw new Error("Failed to fetch email context");
  }

  const context: EmailContext = await contextResponse.json();

  const promptVariables = {
    fullName: session?.user.name,
    emailContent,
    communicationStyle: JSON.stringify(
      {
        tones: context.communication_style.tones,
        greetings: context.communication_style.greetings,
        closings: context.communication_style.closings,
        formalityLevel: context.communication_style.formalityLevel,
        averageLength: context.communication_style.averageLength,
      },
      null,
      2
    ),
    recipientContext: JSON.stringify(
      {
        name: context.recipient.name,
        relationship: context.recipient.relationship,
        organization: context.recipient.organization,
        culturalBackground: context.recipient.cultural_background,
        communicationHistory: context.similar_messages[0]?.message_count || 0,
        responseTime: context.success_metrics.averageResponseTime,
        sentiment: context.success_metrics.sentimentTrend,
        commonTopics: context.success_metrics.commonTopics,
      },
      null,
      2
    ),
    threadHistory: context.similar_messages
      .map((thread) => thread.context)
      .join("\n\n"),
    messagePurpose:
      context.similar_messages[0]?.style_patterns?.commonPhrases[0] ||
      "GENERAL",
  };

  const prompt = await hub.pull("warpmail-improve-email");
  const chain = prompt.pipe(llm);
  const response = await chain.invoke(promptVariables);

  return response.content;
}

export async function sendEmailAction(_: unknown, formData: FormData) {
  const session = await auth();
  if (!session || !session.user || !session.accessToken) {
    return { error: "Not authenticated" };
  }

  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const recipientEmail = formData.get("recipientEmail") as string;
  const replyToEmail = formData.get("replyToEmail") as string | undefined;
  // If you have a stored threadId or related data for replying, parse here.

  if (!subject || !body || !recipientEmail) {
    return {
      error: "Missing required fields",
      previous: { recipientEmail, subject, body },
    };
  }

  // Create the Gmail client
  const gmail = getGmailClient(session);

  // Construct the raw MIME email
  const raw = createRawEmail({
    from: session.user.email!,
    to: recipientEmail,
    subject,
    body,
  });

  try {
    // If replying to an existing thread, you can set threadId here
    const requestBody = {
      raw,
      threadId: replyToEmail ? JSON.parse(replyToEmail).threadId : undefined,
    };

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody,
    });

    return { success: true, info: result.data };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      previous: { recipientEmail, subject, body },
    };
  }
}

function createRawEmail({
  from,
  to,
  subject,
  body,
}: {
  from: string;
  to: string;
  subject: string;
  body: string;
}) {
  const messageParts = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    body,
  ];
  const message = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    // Convert base64 to base64url
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return encodedMessage;
}
