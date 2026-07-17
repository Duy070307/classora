"use client";

import { BookOpenCheck, FileText, MessageCircle, Presentation, RotateCcw } from "lucide-react";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import type { GeneratedDocument } from "@/lib/types";
import { openLessonSlides } from "@/lib/lesson-slides/source";
import { openWorksheetGenerator } from "@/lib/worksheet/session";
import { openLessonPlanGenerator } from "@/lib/lesson-plan/session";
import { openReviewPack } from "@/lib/review-pack/session";

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
      {["lesson-plan", "worksheet", "exam", "rubric"].includes(document.type) ? (
        <button type="button" onClick={() => openLessonSlides(document, document.type === "worksheet" ? "solution" : document.type === "exam" ? "review" : undefined)} className="btn-secondary">
          <Presentation size={16} />
          {document.type === "worksheet" ? "Tạo slide chữa bài" : document.type === "exam" ? "Tạo slide ôn tập" : "Tạo slide bài giảng"}
        </button>
      ) : null}
      {["lesson-plan", "exam", "document-recognition"].includes(document.type) ? <button type="button" className="btn-secondary" onClick={()=>openWorksheetGenerator(document,document.type==="exam"?"review":"practice")}><BookOpenCheck size={16}/>Tạo phiếu học tập</button>:null}
      {["worksheet", "lesson-slides", "exam", "rubric", "document-recognition"].includes(document.type) ? <button type="button" className="btn-secondary" onClick={()=>openLessonPlanGenerator(document,document.type==="exam"?"solution":"new_lesson")}><FileText size={16}/>Tạo giáo án từ nội dung này</button>:null}
      {["lesson-plan", "lesson-slides", "worksheet", "exam", "rubric", "document-recognition", "grading-assistant"].includes(document.type) ? <button type="button" className="btn-secondary" onClick={() => openReviewPack(document)}><BookOpenCheck size={16}/>Tạo đề cương ôn tập</button> : null}
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
