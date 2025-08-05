"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { PostHogProvider } from "posthog-js/react";

import SessionError from "@/components/session-error";
import { ThemeProvider } from "@/components/theme-provider";
import { NewUserDialog } from "@/components/new-user-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      person_profiles: "identified_only",
    });
  }, []);

  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionError />
          <NewUserDialog />
          {children}
        </ThemeProvider>
      </PostHogProvider>
    </SessionProvider>
  );
}
