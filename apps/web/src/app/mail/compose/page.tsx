"use client";

import { Send } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useEmails } from "@/context/EmailContext";
import { sendEmailAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { DiffView } from "@/components/diff-view";
import { EmailImprover } from "@/components/email-improver";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import type { EmailBodyProps, EmailActionResponse, From } from "@/types";

function EmailBody({
  value,
  originalValue,
  onChange,
  improvedContent,
}: EmailBodyProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  // If we have improved content, show the diff view
  if (improvedContent && originalValue) {
    return (
      <DiffView
        original={originalValue}
        improved={improvedContent}
        onChange={onChange}
        className="h-[calc(100vh-400px)]"
      />
    );
  }

  return (
    <Textarea
      name="body"
      placeholder="Tip: Hit ⌘/Ctrl + Enter to send"
      className="w-full h-[calc(100vh-400px)] resize-none border border-input rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground"
      required
      onKeyDown={handleKeyDown}
      onChange={(e) => onChange(e.target.value)}
      value={value}
    />
  );
}

export default function ComposePage() {
  const router = useRouter();
  const [emailContent, setEmailContent] = useState("");
  const { composeData, clearComposeData } = useEmails();
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [improvedContent, setImprovedContent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipientEmail: "",
    subject: "",
  });
  const [recipient, setRecipient] = useState<From | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    const { template, subject, from: fromData } = composeData;

    if (template || subject || fromData) {
      if (template) {
        setEmailContent(template);
      }
      if (subject || fromData) {
        setFormData((prev) => ({
          ...prev,
          subject: subject || prev.subject,
          recipientEmail: fromData?.email || prev.recipientEmail,
        }));
        if (fromData?.name && fromData?.email) {
          setRecipient({
            name: fromData.name,
            email: fromData.email,
          });
        }
      }
      clearComposeData();
    }
  }, [composeData, clearComposeData]);

  const handleImprovedContent = (content: string) => {
    // Store the original content before updating with improvements
    setOriginalContent(emailContent);
    setImprovedContent(content);
    setEmailContent(content);
  };

  const handleAcceptImprovement = () => {
    setImprovedContent(null);
    setOriginalContent(null);
  };

  const handleDeclineImprovement = () => {
    if (originalContent) {
      setEmailContent(originalContent);
    }
    setImprovedContent(null);
    setOriginalContent(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formDataObj = new FormData(e.currentTarget);

    // Validate required fields
    const subject = formDataObj.get("subject") as string;
    const body = formDataObj.get("body") as string;
    const recipientEmail = formDataObj.get("recipientEmail") as string;

    if (!subject.trim() || !body.trim() || !recipientEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please fill in all required fields.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    try {
      const result = (await sendEmailAction(
        null,
        formDataObj
      )) as EmailActionResponse;

      if ("error" in result) {
        toast({
          variant: "destructive",
          title: "Failed to send email",
          description: result.error || "Unknown error occurred",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
        if ("previous" in result) {
          setFormData({
            recipientEmail: result.previous?.recipientEmail || "",
            subject: result.previous?.subject || "",
          });
          setEmailContent(result.previous?.body || "");
        }
      } else {
        toast({
          title: "Success!",
          description: "Your email has been sent",
        });
        router.push("/mail/inbox");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: err instanceof Error ? err.message : "An error occurred",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="flex-grow h-full flex"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-1 flex-col gap-4 p-4"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">
            {formData.subject ? formData.subject : "New Message"}
          </h1>
          <div className="flex items-center gap-2">
            <EmailImprover
              content={emailContent}
              from={recipient}
              onImprovedContent={handleImprovedContent}
              onAccept={handleAcceptImprovement}
              onDecline={handleDeclineImprovement}
            />
            <Button
              type="submit"
              form="email-form"
              variant="default"
              className="flex items-center gap-2"
              disabled={!emailContent.trim()}
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          id="email-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              To
            </span>
            <Input
              required
              type="email"
              name="recipientEmail"
              value={formData.recipientEmail}
              onChange={handleInputChange}
              className="w-full pl-12 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              Subject
            </span>
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full pl-20 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
            />
          </div>
          <EmailBody
            value={emailContent}
            originalValue={originalContent}
            onChange={setEmailContent}
            improvedContent={improvedContent}
          />
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
