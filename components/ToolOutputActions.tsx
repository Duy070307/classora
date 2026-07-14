"use client";

import { MessageCircle, RotateCcw } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import type { GeneratedDocument } from "@/lib/types";

export function ToolOutputActions({
  document,
  onSave,
  onGenerateAgain,
  beforeExport,
}: {
  document: GeneratedDocument;
  onSave: () => void;
  onGenerateAgain?: () => void;
  beforeExport?: () => boolean;
}) {
  function openFeedback() {
    window.dispatchEvent(new CustomEvent("soanlab:open-feedback", {
      detail: {
        category: "Nội dung chưa chính xác",
        message: `Góp ý về kết quả: ${document.title}\n`,
      },
    }));
  }

  return (
    <div className="document-actions sticky top-20 z-10 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-xl">
      <DocumentExportMenu document={document} onSave={onSave} beforeExport={beforeExport} />
      {onGenerateAgain ? (
        <button type="button" onClick={onGenerateAgain} className="btn-secondary">
          <RotateCcw size={16} />
          Tạo lại
        </button>
      ) : null}
      <button type="button" onClick={openFeedback} className="btn-secondary">
        <MessageCircle size={16} />
        Góp ý về kết quả này
      </button>
    </div>
  );
}
