import { useState } from "react";
import { Wand2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { improveEmailAction } from "@/lib/actions";
import { ToastAction } from "@/components/ui/toast";
import { From } from "@/types";

interface EmailImproverProps {
  content: string;
  from?: From;
  onImprovedContent: (content: string) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function EmailImprover({
  content,
  from,
  onImprovedContent,
  onAccept,
  onDecline,
}: EmailImproverProps) {
  const { toast } = useToast();
  const [showActions, setShowActions] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  const improveEmail = async () => {
    if (!content.trim()) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Please write an email first.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    setOriginalContent(content);
    setIsImproving(true);

    try {
      const result = await improveEmailAction(from!, content);

      setPendingChanges(result as string);
      setShowActions(true);
      onImprovedContent(result as string);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to improve email";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: errorMessage,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      onImprovedContent(content);
      setOriginalContent(null);
    } finally {
      setIsImproving(false);
    }
  };

  const handleAccept = () => {
    if (pendingChanges) {
      setPendingChanges(null);
      setOriginalContent(null);
      setShowActions(false);
      onAccept();
    }
  };

  const handleDecline = () => {
    if (originalContent !== null) {
      onImprovedContent(originalContent);
    }
    setPendingChanges(null);
    setOriginalContent(null);
    setShowActions(false);
    onDecline();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {!showActions && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={improveEmail}
                  disabled={isImproving || !content.trim() || !from}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  {isImproving ? "Improving..." : "Improve Email"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to improve your email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {showActions && (
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={handleAccept}
              variant="outline"
              className="flex items-center gap-2 text-green-600 hover:text-green-700"
            >
              <Check className="w-4 h-4" />
              Accept
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
