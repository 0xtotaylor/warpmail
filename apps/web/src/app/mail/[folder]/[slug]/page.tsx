"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

import { Inbox } from "@/components/inbox";
import { useEmails } from "@/context/EmailContext";

export default function EmailPageClient() {
  const params = useParams();
  const { emails } = useEmails();
  const slug = params.slug as string;

  if (!emails) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const email = emails.find((e) => e.id === slug);

  if (!email) {
    return <div>No email found.</div>;
  }

  return <Inbox email={email} />;
}
