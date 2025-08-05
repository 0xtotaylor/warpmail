import jwt from "jsonwebtoken";
import * as Sentry from "@sentry/nextjs";
import type { JWT } from "@auth/core/jwt";
import { ServiceBusMessage } from "@azure/service-bus";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { getServiceBusClient } from "@/utils/azure/client";
import type { NextAuthConfig, DefaultSession, Account } from "next-auth";

import authConfig from "../auth.config";
import { createClient, createServiceClient } from "@/utils/supabase/client";

export const getAuthOptions: (options?: {
  consent: boolean;
}) => NextAuthConfig = (options) => ({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user, account, trigger }): Promise<JWT> => {
      if (trigger === "signUp") {
        token.isNewUser = true;
      }
      if (account && user) {
        if (account.refresh_token) {
          await saveRefreshToken(
            {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: calculateExpiresAt(
                account.expires_in as number | undefined
              ),
            },
            {
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
            }
          );
          token.refresh_token = account.refresh_token;
        } else {
          const supabase = createServiceClient();
          const { data: dbAccount } = await supabase
            .schema("next_auth")
            .from("accounts")
            .select("refresh_token")
            .match({
              providerAccountId: account.providerAccountId,
              provider: "google",
            })
            .single();
          token.refresh_token = dbAccount?.refresh_token ?? undefined;
        }

        token.access_token = account.access_token;
        token.expires_at = account.expires_at;
        token.user = user;

        const signingSecret = process.env.SUPABASE_JWT_SECRET;
        if (signingSecret) {
          const payload = {
            aud: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
            sub: user.id,
            email: user.email,
            role: "authenticated",
          };
          token.supabaseAccessToken = jwt.sign(payload, signingSecret);
        }

        return token;
      }
      if (
        token.expires_at &&
        Date.now() < (token.expires_at as number) * 1000
      ) {
        return token;
      }
      return await refreshAccessToken(token);
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        id: token.sub as string,
      };
      session.supabaseAccessToken = token?.supabaseAccessToken as
        | string
        | undefined;
      session.accessToken = token?.access_token;
      session.error = token?.error as string | undefined;
      session.isNewUser = token?.isNewUser as boolean | undefined;

      if (session.error) Sentry.captureException(new Error(session.error));

      return session;
    },
  },
  events: {
    signIn: async (signInMessage) => {
      const sbClient = getServiceBusClient();
      const sender = sbClient.createSender("annotate");
      try {
        if ("account" in signInMessage && signInMessage.account?.access_token) {
          const serviceBusMessage: ServiceBusMessage = {
            contentType: "application/json",
            body: {
              userId: signInMessage.user.id,
              isNewUser: signInMessage.isNewUser,
              accessToken: signInMessage.account.access_token,
            },
          };
          await sender.sendMessages(serviceBusMessage);
        }
      } finally {
        await sender.close();
        await sbClient.close();
      }
    },
    signOut: async (message) => {
      const token = "token" in message ? message.token : null;
      if (token?.supabaseAccessToken) {
        const supabase = createClient(token.supabaseAccessToken);
        await supabase.auth.signOut();
      }
    },
  },
  ...authConfig(options),
});

export const authOptions = getAuthOptions();

const refreshAccessToken = async (token: JWT): Promise<JWT> => {
  const supabase = createServiceClient();

  const { data: account } = await supabase
    .schema("next_auth")
    .from("accounts")
    .select("userId, refresh_token, providerAccountId")
    .eq("userId", token.sub)
    .eq("provider", "google")
    .single();

  if (!account) {
    Sentry.captureException(
      new Error(
        `No account found in database for token: ${JSON.stringify(token)}`
      )
    );
    return { error: "MissingAccountError" };
  }

  if (!account?.refresh_token) {
    Sentry.captureException(
      new Error(`No refresh token found in database for: ${account.userId}`)
    );
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
      method: "POST",
    });

    const tokens: {
      expires_in: number;
      access_token: string;
      refresh_token: string;
    } = await response.json();

    if (!response.ok) throw tokens;

    const expires_at = calculateExpiresAt(tokens.expires_in);

    await saveRefreshToken(
      { ...tokens, expires_at },
      {
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
      }
    );

    return {
      ...token,
      access_token: tokens.access_token,
      expires_at,
      refresh_token: tokens.refresh_token ?? token.refresh_token,
      error: undefined,
    };
  } catch (error) {
    Sentry.captureException(
      new Error(`Error refreshing access token:: ${error}`)
    );

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

const calculateExpiresAt = (expiresIn?: number) => {
  if (!expiresIn) return undefined;
  return Math.floor(Date.now() / 1000 + (expiresIn - 10));
};

export const saveRefreshToken = async (
  tokens: {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
  },
  account: Pick<Account, "refresh_token" | "providerAccountId">
) => {
  const supabase = createServiceClient();
  return await supabase
    .schema("next_auth")
    .from("accounts")
    .update({
      access_token: tokens.access_token,
      expires_at: tokens.expires_at,
      refresh_token: tokens.refresh_token ?? account.refresh_token,
    })
    .match({
      provider: "google",
      providerAccountId: account.providerAccountId,
    })
    .single();
};

declare module "next-auth" {
  interface Session {
    user: {} & DefaultSession["user"] & { id: string };
    supabaseAccessToken?: string;
    accessToken?: string;
    error?: string | "RefreshAccessTokenError";
    isNewUser?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
    supabaseAccessToken?: string;
    isNewUser?: boolean;
  }
}
