"use client";

import { RotateCcw, Save } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { ExportDocxButton } from "@/components/ExportDocxButton";
import type { GeneratedDocument } from "@/lib/types";

export function ToolOutputActions({
  document,
  onSave,
  onGenerateAgain
}: {
  document: GeneratedDocument;
  onSave: () => void;
  onGenerateAgain?: () => void;
}) {
  return (
    <div className="sticky top-2 z-10 flex flex-wrap gap-2 rounded-lg border border-line bg-white/95 p-2 shadow-sm backdrop-blur">
      <CopyButton text={document.content} />
      <button type="button" onClick={onSave} className="btn-secondary">
        <Save size={16} />
        Lưu lịch sử
      </button>
      <ExportDocxButton document={document} />
      {onGenerateAgain ? (
        <button type="button" onClick={onGenerateAgain} className="btn-secondary">
          <RotateCcw size={16} />
          Tạo lại
        </button>
      ) : null}
    </div>
  );
}
