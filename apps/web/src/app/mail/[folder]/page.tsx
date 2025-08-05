"use client";

import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

import { useEmails } from "@/context/EmailContext";

export default function FolderDefaultPage() {
  const router = useRouter();
  const { getEmailsByFolder, emails } = useEmails();

  const params = useParams();
  const folder = params.folder as string;

  const [loading, setLoading] = useState(true);
  const [hasEmails, setHasEmails] = useState<boolean | null>(null);

  useEffect(() => {
    if (!emails) return;
    setLoading(true);
    const folderEmails = getEmailsByFolder(folder);

    if (!folderEmails?.length) {
      setHasEmails(false);
      setLoading(false);
      return;
    }

    setHasEmails(true);
    router.push(`/mail/${folder}/${folderEmails[0].id}`);
  }, [folder, router, getEmailsByFolder, emails]);

  if (!emails || loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (hasEmails === false) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            No emails in this folder
          </div>
        </div>
      </div>
    );
  }

  return null;
}
