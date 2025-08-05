import React from "react";
import { cn } from "@/lib/utils";
import { diffLines, Change } from "diff";

interface DiffViewProps {
  original: string;
  improved: string;
  className?: string;
  onChange?: (value: string) => void;
}

export function DiffView({
  original,
  improved,
  className,
  onChange,
}: DiffViewProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Enter" || e.key === "NumpadEnter")
    ) {
      e.preventDefault();
    }
  };

  const diff = diffLines(original, improved);

  const renderDiff = (diffArray: Change[]) => {
    return diffArray.map((part, index) => {
      const { added, removed, value } = part;
      const className = cn(
        added
          ? "dark:bg-green-950 dark:text-green-400 bg-green-50 text-green-700"
          : "",
        removed
          ? "dark:bg-red-950 dark:text-red-400 bg-red-50 text-red-700 line-through"
          : "",
        !added && !removed ? "dark:text-gray-300 text-gray-800" : ""
      );

      return (
        <div key={index} className={className}>
          {value}
        </div>
      );
    });
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full h-[calc(100vh-400px)] resize-none border border-input rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200 bg-background overflow-auto">
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange?.(e.currentTarget.textContent || "")}
          onKeyDown={handleKeyDown}
          className="w-full h-full font-mono text-sm focus:outline-none whitespace-pre-wrap text-foreground"
        >
          {renderDiff(diff)}
        </div>
      </div>
    </div>
  );
}
