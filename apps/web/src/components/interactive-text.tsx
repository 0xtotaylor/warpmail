"use client";

import { useState } from "react";

export function InteractiveText({
  text,
  options,
}: {
  text: string;
  options: Record<string, string[]>;
}) {
  // State to track selected values for each variable
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Function to parse text and replace [variables] with dropdowns
  const renderInteractiveText = () => {
    // Split text by brackets while keeping the delimiters
    const parts = text.split(/(\[[^\]]+\])/g);

    return parts.map((part, index) => {
      // Check if this part is a variable (wrapped in brackets)
      if (part.match(/^\[[^\]]+\]$/)) {
        // Remove brackets to get variable name
        const varName = part.slice(1, -1);

        // Get options for this variable, fallback to empty array
        const varOptions = options[varName] || [
          "Option 1",
          "Option 2",
          "Option 3",
        ];

        return (
          <select
            key={index}
            value={selections[varName] || ""}
            onChange={(e) => {
              setSelections((prev) => ({
                ...prev,
                [varName]: e.target.value,
              }));
            }}
            className="px-2 py-1 mx-1 border rounded text-gray-800 bg-white"
          >
            <option value="">Choose {varName}</option>
            {varOptions.map((option, i) => (
              <option key={i} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      // Return regular text as-is
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="p-4">
      {renderInteractiveText()}

      {/* Debug section to show current selections */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Current Selections:</h3>
        <pre className="text-sm">{JSON.stringify(selections, null, 2)}</pre>
      </div>
    </div>
  );
}
