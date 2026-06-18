"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import type { GeneratedDocument } from "@/lib/types";
import { exportDocx } from "@/lib/export-docx";

export function ExportDocxButton({ document }: { document: GeneratedDocument }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleExport() {
    try {
      setStatus("loading");
      await exportDocx(document);
      setStatus("success");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2400);
  }

  return (
    <button type="button" onClick={handleExport} className="btn-primary" disabled={status === "loading"}>
      {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {status === "success" ? "Đã xuất Word" : status === "error" ? "Xuất Word lỗi" : "Xuất Word"}
    </button>
  );
}
