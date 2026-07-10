"use client";

import { FormEvent, useEffect, useState } from "react";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { Sidebar } from "@/components/Sidebar";
import { TemplateSelect } from "@/components/TemplateSelect";
import { createDocument, saveDocument } from "@/lib/history";
import { generateToolContent } from "@/lib/ai/client";
import type { GeneratedDocument, WorksheetInput } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import { sampleWorksheetInput } from "@/lib/sample-data";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { useFormDraft } from "@/hooks/useFormDraft";
import { worksheetPresets } from "@/lib/presets";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { getCurrentSampleId, getWorksheetSamplePrefill, mergeDefined } from "@/lib/sample-prefill";
import { BOOK_SERIES_HELPER_TEXT, BOOK_SERIES_OPTIONS, DEFAULT_BOOK_SERIES, withSourceAlignmentNote } from "@/lib/curriculum";
import { createGenerationRequestContext } from "@/lib/generation/request-context";
import { validateGeneratedTopicText } from "@/lib/generation/topic-validator";

const initialInput: WorksheetInput = {
  subject: "Ngữ văn",
  grade: "6",
  bookSeries: DEFAULT_BOOK_SERIES,
  topic: "Văn bản truyện đồng thoại",
  objective: "Học sinh nhận biết nhân vật, chi tiết tiêu biểu và rút ra bài học từ văn bản.",
  exerciseCount: 5,
  level: "Vừa",
  includeAnswers: true,
  style: "Dễ hiểu",
  extraRequirements: ""
};

export default function WorksheetGeneratorPage() {
  const [input, setInput] = useState(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const draft = useFormDraft("/tools/worksheet-generator", input, setInput);

  useEffect(() => {
    const sampleId = getCurrentSampleId();
    const sample = getWorksheetSamplePrefill(sampleId);
    if (!sample) return;
    queueMicrotask(() => {
      setInput((current) => mergeDefined({ ...initialInput, ...current }, sample as Partial<WorksheetInput>));
      setMessage("Đã điền mẫu phiếu học tập. Có thể chỉnh sửa trước khi tạo.");
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setDocument(null);
      setMessage("");
    });
  }, [input.subject, input.grade, input.topic, input.bookSeries]);

  async function generate() {
    if (!input.subject.trim()) return setMessage("Vui lòng nhập môn học.");
    if (!input.topic.trim()) return setMessage("Vui lòng nhập chủ đề.");
    if (input.exerciseCount <= 0) return setMessage("Số bài tập phải lớn hơn 0.");
    setLoading(true);
    setMessage("");
    try {
    const aiResult = await generateToolContent({ tool: "worksheet", input: input as unknown as Record<string, unknown> });
    const generated = withSourceAlignmentNote(aiResult.content, input as unknown as Record<string, unknown>);
    const fidelity = validateGeneratedTopicText(createGenerationRequestContext(input as unknown as Record<string, unknown>, "worksheet"), generated);
    if (!fidelity.valid) throw new Error("SOẠN LAB chưa tạo được đủ nội dung bám sát chủ đề này. Thầy cô có thể mô tả cụ thể hơn hoặc giảm số lượng yêu cầu.");
    const content = applyTemplate(resolveTemplate(templateId), generated, { subject: input.subject, grade: input.grade, bookSeries: input.bookSeries, topic: input.topic, objective: input.objective, extraRequirements: input.extraRequirements });
    const next = createDocument(`Phiếu học tập ${input.subject} lớp ${input.grade}`, "worksheet", content);
    next.generationMeta = { subject: input.subject, grade: input.grade, topic: input.topic, source: "automatic", warnings: ["Nội dung đã được kiểm tra độ bám chủ đề."], requestContext: createGenerationRequestContext(input as unknown as Record<string, unknown>, "worksheet") };
    setDocument(next);
    incrementUsage();
    setMessage("Đã tạo phiếu học tập thành công.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kh\u00f4ng th\u1ec3 t\u1ea1o phi\u1ebfu h\u1ecdc t\u1eadp l\u00fac n\u00e0y.");
    }
    setLoading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  function handleSave() {
    if (!document) return;
    saveDocument(document);
    setMessage("Đã lưu vào lịch sử.");
  }

  function handleRefined(content: string) {
    if (!document) return;
    const fidelity = validateGeneratedTopicText(createGenerationRequestContext(input as unknown as Record<string, unknown>, "worksheet"), content);
    if (!fidelity.valid) return setMessage("Nội dung tinh chỉnh chưa bám sát chủ đề nên chưa được áp dụng.");
    setDocument({ ...document, content });
    setMessage("Đã tinh chỉnh nội dung.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Tạo phiếu học tập" description="Tạo nhanh phiếu học tập có mục tiêu, tóm tắt kiến thức, bài tập và đáp án." />
        <ToolWorkspaceLayout
          form={
          <form onSubmit={handleSubmit} className="tool-form-card">
            <button type="button" className="btn-secondary w-full" onClick={() => { setInput(sampleWorksheetInput); setMessage("Đã điền mẫu nhanh."); }}>Điền thử mẫu nhanh</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <PresetSelect presets={worksheetPresets} onApply={(values) => setInput((current) => ({ ...current, ...values }))} />
            <TemplateSelect type="Phiếu học tập" value={templateId} onChange={setTemplateId} />
            <div className="form-section space-y-4">
              <p className="form-section-title">Thông tin phiếu</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Môn học</label><input className="form-field mt-1" value={input.subject} onChange={(e) => setInput({ ...input, subject: e.target.value })} /></div>
              <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.grade} onChange={(e) => setInput({ ...input, grade: e.target.value })} /></div>
            </div>
            <div>
              <label className="label">Bộ sách / định hướng nội dung</label>
              <select className="form-field mt-1" value={input.bookSeries} onChange={(e) => setInput({ ...input, bookSeries: e.target.value })}>{BOOK_SERIES_OPTIONS.map((value) => <option key={value}>{value}</option>)}</select>
              <p className="mt-1 text-xs leading-5 text-muted">{BOOK_SERIES_HELPER_TEXT}</p>
            </div>
            <div><label className="label">Chủ đề</label><input className="form-field mt-1" value={input.topic} onChange={(e) => setInput({ ...input, topic: e.target.value })} /></div>
            <div><label className="label">Mục tiêu bài học</label><textarea className="form-field mt-1 min-h-24" value={input.objective} onChange={(e) => setInput({ ...input, objective: e.target.value })} /></div>
            </div>
            <div className="form-section">
              <p className="form-section-title">Thiết lập bài tập</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="label">Số bài tập</label><input type="number" className="form-field mt-1" value={input.exerciseCount} onChange={(e) => setInput({ ...input, exerciseCount: Number(e.target.value) })} /></div>
              <div><label className="label">Mức độ</label><select className="form-field mt-1" value={input.level} onChange={(e) => setInput({ ...input, level: e.target.value as WorksheetInput["level"] })}><option>Cơ bản</option><option>Vừa</option><option>Nâng cao</option></select></div>
              <div><label className="label">Phong cách</label><select className="form-field mt-1" value={input.style} onChange={(e) => setInput({ ...input, style: e.target.value as WorksheetInput["style"] })}><option>Ngắn gọn</option><option>Dễ hiểu</option><option>Nhiều ví dụ</option></select></div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeAnswers} onChange={(e) => setInput({ ...input, includeAnswers: e.target.checked })} /> Có đáp án không</label>
            </div>
            <div><label className="label">Yêu cầu thêm</label><textarea className="form-field mt-1 min-h-24" value={input.extraRequirements} onChange={(e) => setInput({ ...input, extraRequirements: e.target.value })} /></div>
            <div className="tool-tip-card"><p className="font-bold text-blue-800">Mẹo phiếu học tập</p><p className="mt-1">Mục tiêu càng rõ, phần bài tập và đáp án càng dễ kiểm tra sau khi xuất Word.</p></div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo phiếu học tập"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          }
          output={
            <ToolOutputPanel loading={loading} loadingTitle="Đang tạo phiếu học tập..." loadingDescription="Soạn Lab đang chuẩn bị mục tiêu, kiến thức cần nhớ và bài tập." hasOutput={Boolean(document)} showWarning={false}>
              {document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool="worksheet" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
              ) : null}
            </ToolOutputPanel>
          }
        />
      </main>
    </div>
  );
}
