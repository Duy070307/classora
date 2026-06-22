"use client";

import { Copy, Download, FileText, Printer, Save } from "lucide-react";
import { useState } from "react";
import { exportDocx } from "@/lib/export-docx";
import { downloadMarkdown, downloadTxt } from "@/lib/export-text";
import { printGeneratedDocument } from "@/lib/print-document";
import type { GeneratedDocument } from "@/lib/types";

export function DocumentExportMenu({ document, onSave, compact = false }: { document: GeneratedDocument; onSave?: () => void; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(document.content || ""); setMessage("Đã sao chép"); }
    catch { setMessage("Không thể sao chép"); }
    setTimeout(() => setMessage(""), 1800);
  }
  async function word() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportDocx(document);
      setMessage("Đã xuất Word");
    } catch {
      setMessage("Không thể xuất Word");
    } finally {
      setExporting(false);
      setTimeout(() => setMessage(""), 2200);
    }
  }
  const buttonClass = compact ? "btn-secondary min-h-9 px-3 py-1.5 text-xs" : "btn-secondary";

  return <div className="document-actions flex flex-wrap gap-2">
    <button type="button" aria-label="Sao chép nội dung tài liệu" className={buttonClass} onClick={copy}><Copy size={16} />{message || "Sao chép"}</button>
    {onSave ? <button type="button" aria-label="Lưu tài liệu vào lịch sử" className={buttonClass} onClick={onSave}><Save size={16} />Lưu lịch sử</button> : null}
    <button type="button" aria-label="Xuất tài liệu Word" disabled={exporting} className={buttonClass} onClick={word}><Download size={16} />{exporting ? "Đang xuất..." : document.type === "exam" ? "Xuất Word dạng đề thi" : "Xuất Word"}</button>
    <button type="button" aria-label="Mở bản in hoặc lưu PDF" className={buttonClass} onClick={() => printGeneratedDocument(document)}><Printer size={16} />In / Lưu PDF</button>
    <button type="button" aria-label="Tải tài liệu Markdown" className={buttonClass} onClick={() => downloadMarkdown(document)}><FileText size={16} />Tải Markdown</button>
    <button type="button" aria-label="Tải tài liệu văn bản TXT" className={buttonClass} onClick={() => downloadTxt(document)}><FileText size={16} />Tải TXT</button>
  </div>;
}
