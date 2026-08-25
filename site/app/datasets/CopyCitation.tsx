"use client";

import { useState } from "react";

// One button, one job: put the citation line on the clipboard. The line
// itself stays visible and selectable — this is a convenience, not the
// only path.
export function CopyCitation({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`datasets-copy${copied ? " is-copied" : ""}`}
      onClick={() =>
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {})
      }
    >
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}
