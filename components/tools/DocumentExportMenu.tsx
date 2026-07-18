"use client";

import { Copy, Save } from "lucide-react";
import { useState } from "react";
import { ActionMenu } from "@/components/question-bank/ActionMenu";
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
  const buttonClass = compact
    ? "btn-secondary min-h-9 px-3 py-1.5 text-xs"
    : "btn-secondary";
  if (
    document.type === "lesson-slides" ||
    document.type === "answer-sheet" ||
    document.examBlueprint ||
    document.worksheet ||
    document.lessonPlan
  )
    return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        normalizeGeneratedDocument(document).content || "",
      );
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
    <div
      className="document-actions flex flex-wrap gap-2"
      data-document-export-menu
    >
      <button
        type="button"
        aria-label="Sao chép nội dung tài liệu"
        className={buttonClass}
        onClick={copy}
      >
        <Copy size={16} /> {message || "Sao chép"}
      </button>
      {onSave ? (
        <button
          type="button"
          aria-label="Lưu tài liệu vào lịch sử"
          className={buttonClass}
          onClick={onSave}
        >
          <Save size={16} /> Lưu lịch sử
        </button>
      ) : null}
      <ActionMenu
        label={exporting ? "Đang xuất…" : "Xuất"}
        className={buttonClass}
        items={[
          {
            label:
              document.type === "exam" ? "Word dạng đề thi" : "Tài liệu Word",
            onSelect: word,
            disabled: exporting,
          },
          {
            label: "In hoặc lưu PDF",
            onSelect: () => {
              if (beforeExport?.() ?? confirmExamExport(document))
                printGeneratedDocument(normalizeGeneratedDocument(document));
            },
          },
          {
            label: "Tải Markdown",
            onSelect: () =>
              downloadMarkdown(normalizeGeneratedDocument(document)),
          },
          {
            label: "Tải TXT",
            onSelect: () => downloadTxt(normalizeGeneratedDocument(document)),
          },
        ]}
      />
    </div>
  );
}
