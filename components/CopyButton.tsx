"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("success");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <button type="button" aria-label={label} onClick={handleCopy} className="btn-secondary">
      <Copy size={16} />
      {status === "success" ? "Đã copy" : status === "error" ? "Không copy được" : label}
    </button>
  );
}
