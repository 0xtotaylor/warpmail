"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function NewUserDialog() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (session?.isNewUser) {
      setOpen(true);
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Welcome to the Warpmail Beta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription>
            Thank you for trying out our beta! Please note that some features
            are still under development and may not work as expected.
          </DialogDescription>

          <div className="space-y-2">
            <div className="font-medium">Analyzing your tone of voice...</div>
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {progress < 100 ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {Math.round((300 - progress * 3) / 60)} minutes remaining
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Analysis complete
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            The app becomes more personalized and useful after analyzing your
            email patterns for about 5 minutes. During this time, we&apos;ll
            learn your:
          </div>

          <ul className="list-disc pl-4 text-sm text-muted-foreground">
            <li>Communication style and tone preferences</li>
            <li>Common email patterns and responses</li>
            <li>Frequent contacts and relationships</li>
            <li>Typical response times and behaviors</li>
          </ul>

          <Button
            className="w-full"
            onClick={() => setOpen(false)}
            disabled={progress < 100}
          >
            {progress < 100 ? "Please wait..." : "Get Started"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
