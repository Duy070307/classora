"use client";

import { Copy, Download, FileText, Printer, Save } from "lucide-react";
import { useState } from "react";
import { exportDocx } from "@/lib/export-docx";
import { downloadMarkdown, downloadTxt } from "@/lib/export-text";
import { printGeneratedDocument } from "@/lib/print-document";
import type { GeneratedDocument } from "@/lib/types";
import { normalizeGeneratedDocument } from "@/lib/content/generated-content";
import { confirmExamExport } from "@/lib/exam-audit/document";

export function DocumentExportMenu({
  document,
  onSave,
  compact = false,
  beforeExport,
}: {
  document: GeneratedDocument;
  onSave?: () => void;
  compact?: boolean;
  beforeExport?: () => boolean;
}) {
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const buttonClass = compact ? "btn-secondary min-h-9 px-3 py-1.5 text-xs" : "btn-secondary";
  if (document.type === "lesson-slides" || document.type === "answer-sheet" || document.examBlueprint || document.worksheet || document.lessonPlan) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(normalizeGeneratedDocument(document).content || "");
      setMessage("Đã sao chép vào bộ nhớ tạm.");
    } catch {
      setMessage("Chưa thể sao chép. Vui lòng thử lại.");
    }
    setTimeout(() => setMessage(""), 1800);
  }

  async function word() {
    if (exporting) return;
    if (!(beforeExport?.() ?? confirmExamExport(document))) return;
    setExporting(true);
      setMessage("Đang xuất Word…");
    try {
      await exportDocx(normalizeGeneratedDocument(document));
      setMessage("Đã xuất Word.");
    } catch {
      setMessage("Chưa thể xuất Word. Vui lòng thử lại.");
    } finally {
      setExporting(false);
      setTimeout(() => setMessage(""), 2200);
    }
  }

  return (
    <div className="document-actions flex flex-wrap gap-2">
      <button type="button" aria-label="Sao chép nội dung tài liệu" className={buttonClass} onClick={copy}>
        <Copy size={16} /> {message || "Sao chép"}
      </button>
      {onSave ? (
        <button type="button" aria-label="Lưu tài liệu vào lịch sử" className={buttonClass} onClick={onSave}>
          <Save size={16} /> Lưu lịch sử
        </button>
      ) : null}
      <button type="button" aria-label="Xuất tài liệu Word" disabled={exporting} className={buttonClass} onClick={word}>
        <Download size={16} /> {exporting ? "Đang xuất Word…" : document.type === "exam" ? "Xuất Word dạng đề thi" : "Xuất Word"}
      </button>
      <button type="button" aria-label="Mở bản in hoặc lưu PDF" className={buttonClass} onClick={() => {
        if (beforeExport?.() ?? confirmExamExport(document)) printGeneratedDocument(normalizeGeneratedDocument(document));
      }}>
        <Printer size={16} /> Xuất PDF
      </button>
      <button type="button" aria-label="Tải tài liệu Markdown" className={buttonClass} onClick={() => downloadMarkdown(normalizeGeneratedDocument(document))}>
        <FileText size={16} /> Tải Markdown
      </button>
      <button type="button" aria-label="Tải tài liệu TXT" className={buttonClass} onClick={() => downloadTxt(normalizeGeneratedDocument(document))}>
        <FileText size={16} /> Tải TXT
      </button>
    </div>
  );
}
