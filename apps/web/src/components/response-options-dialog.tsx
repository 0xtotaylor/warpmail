"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Zap, Reply, Edit } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { From } from "@/types";
import { useEmails } from "@/context/EmailContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generateResponsesAction } from "@/lib/actions";

interface ResponseOption {
  title: string;
  description: string;
  template: string;
}

interface ResponseOptionsDialogProps {
  emailContent: string;
  senderName: string;
  subject: string;
  from: From;
  folder: string;
}

export function ResponseOptionsDialog({
  emailContent,
  senderName,
  subject,
  from,
  folder,
}: ResponseOptionsDialogProps) {
  const router = useRouter();
  const { setComposeData } = useEmails();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [responseOptions, setResponseOptions] = React.useState<
    ResponseOption[]
  >([]);

  const generateResponses = React.useCallback(async () => {
    if (!emailContent) return;

    setIsLoading(true);
    try {
      const results = await generateResponsesAction(emailContent, senderName);
      setResponseOptions(results);
    } catch (error) {
      console.error("Failed to generate responses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [emailContent, senderName]);

  const handleReply = (from: From) => {
    setComposeData({
      subject: subject,
      from: from,
    });
    router.push("/mail/compose");
  };

  React.useEffect(() => {
    if (emailContent && isOpen) {
      generateResponses();
    }
  }, [emailContent, generateResponses, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setResponseOptions([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Reply
          </Button>
        </DialogTrigger>
        <Button
          variant="default"
          className="flex items-center gap-2"
          onClick={() => handleReply(from)}
        >
          {folder === "drafts" ? (
            <Edit className="w-4 h-4" />
          ) : (
            <Reply className="w-4 h-4" />
          )}
          {folder === "drafts" ? "Edit" : "Reply"}
        </Button>
      </div>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose a response</DialogTitle>
          <DialogDescription>
            Select an option to generate a relevant response
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
            </>
          ) : responseOptions.length > 0 ? (
            <div className="relative">
              <div className="grid gap-4">
                {responseOptions.map((option) => (
                  <Button
                    key={option.title}
                    variant="outline"
                    className="flex flex-col items-start gap-1 p-4 h-auto"
                    onClick={() => {
                      setComposeData({
                        template: option.template,
                        subject: subject,
                        from: from,
                      });
                      router.push("/mail/compose");
                    }}
                  >
                    <span className="font-semibold">{option.title}</span>
                    <span className="text-sm text-muted-foreground text-left">
                      {option.description}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              No response options available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
