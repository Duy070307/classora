"use client";

import { useRef, useState } from "react";
import { AssessmentStepVisual, TeachingDocumentVisual, type AssessmentVisualId, type TeachingVisualId } from "@/components/landing/PublicProductVisuals";

const assessmentSteps: ReadonlyArray<{ id: AssessmentVisualId; title: string; description: string }> = [
  { id: "generate", title: "Tạo đề", description: "Cấu hình môn, lớp, thời lượng và số câu." },
  { id: "blueprint", title: "Ma trận", description: "Phân bổ nội dung, mức độ và điểm số." },
  { id: "audit", title: "Kiểm tra đề", description: "Phát hiện điểm cần rà soát trước khi xuất." },
  { id: "solutions", title: "Lời giải", description: "Tách đáp án và hướng dẫn chấm cho giáo viên." },
  { id: "mix", title: "Trộn mã", description: "Tạo các mã đề với đáp án tương ứng." },
  { id: "answer-sheet", title: "Phiếu trả lời", description: "Chuẩn bị phiếu theo đúng cấu trúc đề." },
  { id: "grading", title: "Chấm bài", description: "Xác nhận kết quả trước khi lưu điểm." },
];

const teachingTools: ReadonlyArray<{ id: TeachingVisualId; title: string; description: string }> = [
  { id: "lesson-plan", title: "Giáo án", description: "Mục tiêu, hoạt động và minh chứng được nối trong cùng kế hoạch." },
  { id: "worksheet", title: "Phiếu học tập", description: "Nhiệm vụ cơ bản, vận dụng và đáp án dành cho giáo viên." },
  { id: "slides", title: "Slide bài giảng", description: "Dàn ý đã rà soát được chuyển thành slide có thể chỉnh sửa." },
  { id: "review-pack", title: "Đề cương ôn tập", description: "Kiến thức trọng tâm, ví dụ và bài luyện tập theo chủ đề." },
  { id: "rubric", title: "Rubric", description: "Tiêu chí, mức độ và hướng dẫn chấm rõ ràng." },
];

function nextIndex(current: number, key: string, length: number) {
  if (key === "ArrowRight" || key === "ArrowDown") return (current + 1) % length;
  if (key === "ArrowLeft" || key === "ArrowUp") return (current - 1 + length) % length;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  return current;
}

export function AssessmentWorkflowStory() {
  const [active, setActive] = useState<AssessmentVisualId>("generate");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = assessmentSteps.findIndex((step) => step.id === active);
  const activeStep = assessmentSteps[activeIndex];

  function moveFocus(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = nextIndex(index, event.key, assessmentSteps.length);
    if (target === index && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setActive(assessmentSteps[target].id);
    refs.current[target]?.focus();
  }

  return (
    <div className="mt-10" data-testid="assessment-workflow-story">
      <div className="grid border-y border-amber-200 lg:grid-flow-col lg:auto-cols-fr" role="tablist" aria-label="Các bước chuẩn bị và chấm đề">
        {assessmentSteps.map((step, index) => {
          const selected = step.id === active;
          return (
            <button
              key={step.id}
              ref={(node) => { refs.current[index] = node; }}
              id={`assessment-tab-${step.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`assessment-panel-${step.id}`}
              tabIndex={selected ? 0 : -1}
              data-state={selected ? "active" : "inactive"}
              onClick={() => setActive(step.id)}
              onKeyDown={(event) => moveFocus(event, index)}
              className={`public-workflow-tab group flex min-h-14 items-center gap-3 border-b border-amber-100 px-3 py-3 text-left transition duration-200 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 ${selected ? "bg-amber-50 text-amber-950" : "bg-white text-slate-600 hover:bg-amber-50/50 hover:text-slate-950"}`}
            >
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-amber-600 text-white" : "border border-slate-300 bg-white text-slate-500"}`}>{index + 1}</span>
              <span className="min-w-0"><span className="block text-sm font-semibold">{step.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 lg:hidden">{step.description}</span></span>
            </button>
          );
        })}
      </div>
      <div
        key={active}
        id={`assessment-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`assessment-tab-${active}`}
        className="public-switch-panel mt-6"
      >
        <div className="mb-4 flex items-start gap-3"><span className="mt-1 h-8 w-1 rounded-full bg-amber-500" aria-hidden="true" /><div><h3 className="font-semibold text-slate-950">{activeStep.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{activeStep.description}</p></div></div>
        <AssessmentStepVisual id={active} />
      </div>
    </div>
  );
}

export function TeachingDocumentWorkflow() {
  const [active, setActive] = useState<TeachingVisualId>("lesson-plan");
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const target = nextIndex(index, event.key, teachingTools.length);
    if (target === index && !["Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setActive(teachingTools[target].id);
    refs.current[target]?.focus();
  }

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start" data-testid="teaching-document-workflow">
      <div className="border-y border-violet-200 bg-white" role="tablist" aria-label="Nhóm tài liệu dạy học">
        {teachingTools.map((tool, index) => {
          const selected = tool.id === active;
          return (
            <button
              key={tool.id}
              ref={(node) => { refs.current[index] = node; }}
              id={`teaching-tab-${tool.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`teaching-panel-${tool.id}`}
              tabIndex={selected ? 0 : -1}
              data-state={selected ? "active" : "inactive"}
              onClick={() => setActive(tool.id)}
              onKeyDown={(event) => moveFocus(event, index)}
              className={`public-interactive-row w-full border-b border-violet-100 px-4 py-4 text-left transition duration-200 last:border-b-0 ${selected ? "border-l-2 border-l-violet-600 bg-violet-50 text-violet-950" : "border-l-2 border-l-transparent text-slate-700 hover:bg-violet-50/50"}`}
            >
              <span className="block text-sm font-semibold">{tool.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{tool.description}</span>
            </button>
          );
        })}
      </div>
      <div key={active} id={`teaching-panel-${active}`} role="tabpanel" aria-labelledby={`teaching-tab-${active}`} className="public-switch-panel min-w-0">
        <TeachingDocumentVisual id={active} />
      </div>
    </div>
  );
}
