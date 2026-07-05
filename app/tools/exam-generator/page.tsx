"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { AppShell } from "@/components/AppShell";
import { TemplateSelect } from "@/components/TemplateSelect";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { ToolOutputPanel } from "@/components/tools/ToolOutputPanel";
import { ToolWorkspaceLayout } from "@/components/tools/ToolWorkspaceLayout";
import { useFormDraft } from "@/hooks/useFormDraft";
import { examPresets } from "@/lib/presets";
import { createDocument, saveDocument } from "@/lib/history";
import { generateToolContent } from "@/lib/ai/client";
import { getDocumentSettings } from "@/lib/document-settings";
import { getQuestions } from "@/lib/question-bank";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import type { ExamInput, GeneratedDocument, QuestionItem } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { sampleExamInput } from "@/lib/sample-data";
import { createStructuredExam } from "@/lib/mock-exam-generator";
import { getCurrentSampleId, getExamSamplePrefill, mergeDefined } from "@/lib/sample-prefill";

const initialInput: ExamInput = {
  schoolName: "",
  teacherName: "",
  subject: "Toán",
  grade: "7",
  topic: "Tỉ lệ thức và dãy tỉ số bằng nhau",
  duration: "45 phút",
  examType: "Kết hợp",
  examStyle: "Kiểm tra thường",
  multipleChoiceCount: 8,
  essayCount: 3,
  trueFalseCount: 2,
  shortAnswerCount: 3,
  examCode: "0101",
  totalScore: 10,
  level: "Trung bình",
  recognitionRate: 30,
  understandingRate: 40,
  applicationRate: 20,
  advancedRate: 10,
  includeAnswers: true,
  includeRubric: true,
  includeMatrix: true,
  includeSpecification: true,
  extraRequirements: ""
};

export default function ExamGeneratorPage() {
  const [input, setInput] = useState(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [useBank, setUseBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<QuestionItem[]>([]);
  const [bankDifficulty, setBankDifficulty] = useState("");
  const [bankCount, setBankCount] = useState(5);
  const normalizeExamDraft = useCallback((saved: ExamInput) => ({ ...initialInput, ...saved }), []);
  const draft = useFormDraft("/tools/exam-generator", input, setInput, normalizeExamDraft);

  useEffect(() => {
    queueMicrotask(() => {
      const settings = getDocumentSettings();
      setInput((current) => ({
        ...current,
        schoolName: current.schoolName || settings.schoolName,
        teacherName: current.teacherName || settings.teacherName
      }));
      setBankQuestions(getQuestions());
    });
  }, []);

  useEffect(() => {
    const sampleId = getCurrentSampleId();
    const sample = getExamSamplePrefill(sampleId);
    if (!sample) return;
    queueMicrotask(() => {
      setInput((current) => mergeDefined({ ...initialInput, ...current }, sample as Partial<ExamInput>));
      setMessage("Đã điền mẫu nhanh. Thầy/cô có thể chỉnh sửa trước khi tạo.");
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  async function generate() {
    if (!input.subject.trim()) return setMessage("Vui lòng nhập môn học.");
    if (!input.grade.trim()) return setMessage("Vui lòng nhập lớp.");
    if (input.multipleChoiceCount + input.trueFalseCount + input.shortAnswerCount <= 0) return setMessage("Tổng số câu phải lớn hơn 0.");
    if ([input.recognitionRate, input.understandingRate, input.applicationRate, input.advancedRate].reduce((a, b) => a + b, 0) !== 100) return setMessage("Tổng tỉ lệ mức độ nên bằng 100%.");
    setLoading(true);
    setMessage("");
    try {
    const aiResult = await generateToolContent({ tool: "exam", input: input as unknown as Record<string, unknown> });
    const generatedRaw = aiResult.content;
    const generated = generatedRaw
      .replace(/\nI\.\s+/i, "\nBẢN DÀNH CHO HỌC SINH\n\nI. ")
      .replace(/\nIII\.\s+/i, "\nPHẦN DÀNH CHO GIÁO VIÊN\n\nIII. ");
    const matching = bankQuestions.filter((item) =>
      item.subject.toLowerCase() === input.subject.toLowerCase()
      && item.grade.toLowerCase() === input.grade.toLowerCase()
      && (!input.topic || item.topic.toLowerCase().includes(input.topic.toLowerCase()) || input.topic.toLowerCase().includes(item.topic.toLowerCase()))
      && (!bankDifficulty || item.difficulty === bankDifficulty)
    ).slice(0, bankCount);
    const bankContent = useBank && matching.length
      ? `\n\nCÂU HỎI TỪ NGÂN HÀNG\n${matching.map((item, index) => `Câu NH${index + 1}. ${item.question}\nĐáp án: ${item.answer || "Giáo viên bổ sung"}`).join("\n\n")}`
      : "";
    const content = applyTemplate(resolveTemplate(templateId), generated + bankContent, {
      subject: input.subject,
      grade: input.grade,
      topic: input.topic,
      duration: input.duration,
      extraRequirements: input.extraRequirements
    });
    const next = createDocument(`Đề kiểm tra ${input.subject} lớp ${input.grade}`, "exam", content);
    next.structuredExam = aiResult.structuredExam || createStructuredExam(input);
    next.generationMeta = {
      provider: aiResult.provider,
      providerRequested: aiResult.providerRequested,
      fallbackUsed: aiResult.fallbackUsed,
      fallbackReason: aiResult.providerFallbackReason,
      retryCount: aiResult.retryCount
    };
    next.examMeta = {
      schoolName: input.schoolName,
      teacherName: input.teacherName,
      subject: input.subject,
      grade: input.grade,
      duration: input.duration,
      topic: input.topic,
      examCode: input.examCode.padStart(4, "0"),
      examStyle: input.examStyle
    };
    setDocument(next);
    incrementUsage();
    setMessage(`Đã tạo đề kiểm tra thành công (${aiResult.provider === "local" ? "chế độ cục bộ" : `qua ${aiResult.provider}`}).`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo đề kiểm tra lúc này.");
    }
    setLoading(false);
  }

  function handleSave() {
    if (!document) return;
    saveDocument(document);
    setMessage("Đã lưu vào lịch sử.");
  }

  function handleRefined(content: string) {
    if (!document) return;
    setDocument({ ...document, content });
    setMessage("Đã tinh chỉnh nội dung.");
  }

  function useSampleData() {
    const settings = getDocumentSettings();
    setInput({ ...sampleExamInput, schoolName: settings.schoolName || sampleExamInput.schoolName, teacherName: settings.teacherName || sampleExamInput.teacherName });
    setMessage("Đã điền dữ liệu mẫu.");
  }

  return (
    <AppShell title="Tạo đề kiểm tra">
        <PageHeader title="Tạo đề kiểm tra" description="Tạo bản nháp đề kiểm tra, đáp án, thang điểm và ma trận trong vài phút." />
        <ToolWorkspaceLayout
          form={
          <form onSubmit={handleSubmit} className="tool-form-card">
            <button type="button" onClick={useSampleData} className="btn-secondary w-full">Điền thử mẫu nhanh</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <div><p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-blue-700">Mẫu nhanh theo môn</p><PresetSelect presets={examPresets} onApply={(values) => setInput((current) => ({ ...current, ...values }))} /></div>
            <TemplateSelect type="Đề kiểm tra" value={templateId} onChange={setTemplateId} />
            <div className="form-section">
              <p className="form-section-title">Thông tin chung</p>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Tên trường/trung tâm</label><input className="form-field mt-1" value={input.schoolName} onChange={(e) => setInput({ ...input, schoolName: e.target.value })} /></div>
                  <div><label className="label">Tên giáo viên</label><input className="form-field mt-1" value={input.teacherName} onChange={(e) => setInput({ ...input, teacherName: e.target.value })} /></div>
                </div>
                <div><label className="label">Môn học</label><input className="form-field mt-1" value={input.subject} onChange={(e) => setInput({ ...input, subject: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.grade} onChange={(e) => setInput({ ...input, grade: e.target.value })} /></div>
                  <div><label className="label">Thời gian làm bài</label><input className="form-field mt-1" value={input.duration ?? ""} onChange={(e) => setInput({ ...input, duration: e.target.value })} /></div>
                </div>
                <div><label className="label">Chủ đề/chương</label><input className="form-field mt-1" value={input.topic} onChange={(e) => setInput({ ...input, topic: e.target.value })} /></div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-title">Cấu trúc đề</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Kiểu đề</label><select className="form-field mt-1" value={input.examStyle} onChange={(e) => setInput({ ...input, examStyle: e.target.value as ExamInput["examStyle"] })}><option>Kiểm tra thường</option><option>THPTQG / tốt nghiệp</option><option>Giữa kỳ</option><option>Cuối kỳ</option></select></div>
                <div><label className="label">Mức độ chung</label><select className="form-field mt-1" value={input.level} onChange={(e) => setInput({ ...input, level: e.target.value as ExamInput["level"] })}><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><label className="label">Số câu PHẦN I</label><input type="number" min="0" className="form-field mt-1" value={input.multipleChoiceCount ?? 0} onChange={(e) => setInput({ ...input, multipleChoiceCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu PHẦN II</label><input type="number" min="0" className="form-field mt-1" value={input.trueFalseCount ?? 0} onChange={(e) => setInput({ ...input, trueFalseCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu PHẦN III</label><input type="number" min="0" className="form-field mt-1" value={input.shortAnswerCount ?? 0} onChange={(e) => setInput({ ...input, shortAnswerCount: Number(e.target.value) })} /></div>
                <div><label className="label">Tổng điểm</label><input type="number" className="form-field mt-1" value={input.totalScore ?? 0} onChange={(e) => setInput({ ...input, totalScore: Number(e.target.value) })} /></div>
              </div>
              <div className="mt-3"><label className="label">Mã đề</label><input className="form-field mt-1 max-w-48" value={input.examCode ?? ""} onChange={(e) => setInput({ ...input, examCode: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-blue-700">Mức độ nhận thức</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div><label className="label">Tỉ lệ nhận biết</label><input type="number" className="form-field mt-1" value={input.recognitionRate ?? 0} onChange={(e) => setInput({ ...input, recognitionRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ thông hiểu</label><input type="number" className="form-field mt-1" value={input.understandingRate ?? 0} onChange={(e) => setInput({ ...input, understandingRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng</label><input type="number" className="form-field mt-1" value={input.applicationRate ?? 0} onChange={(e) => setInput({ ...input, applicationRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng cao</label><input type="number" className="form-field mt-1" value={input.advancedRate ?? 0} onChange={(e) => setInput({ ...input, advancedRate: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Tùy chọn tài liệu</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeAnswers} onChange={(e) => setInput({ ...input, includeAnswers: e.target.checked })} /> Có tạo đáp án không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeRubric} onChange={(e) => setInput({ ...input, includeRubric: e.target.checked })} /> Có tạo thang điểm không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeMatrix} onChange={(e) => setInput({ ...input, includeMatrix: e.target.checked })} /> Có tạo ma trận đề không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeSpecification} onChange={(e) => setInput({ ...input, includeSpecification: e.target.checked })} /> Có bản đặc tả đề không</label>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Mẫu tài liệu / ngân hàng câu hỏi</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={useBank} onChange={(e) => setUseBank(e.target.checked)} /> Lấy câu hỏi từ ngân hàng câu hỏi</label>
              {useBank ? <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Mức độ</label><select className="form-field mt-1" value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value)}><option value="">Mọi mức độ</option>{["Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao"].map((value) => <option key={value}>{value}</option>)}</select></div>
                  <div><label className="label">Số câu lấy tối đa</label><input type="number" min="1" className="form-field mt-1" value={bankCount} onChange={(e) => setBankCount(Number(e.target.value))} /></div>
                </div>
                {bankQuestions.filter((item) => item.subject.toLowerCase() === input.subject.toLowerCase() && item.grade.toLowerCase() === input.grade.toLowerCase() && (!bankDifficulty || item.difficulty === bankDifficulty)).length ? (
                  <div className="max-h-40 space-y-2 overflow-auto rounded-md border border-line bg-white p-3 text-sm">
                    {bankQuestions.filter((item) => item.subject.toLowerCase() === input.subject.toLowerCase() && item.grade.toLowerCase() === input.grade.toLowerCase() && (!bankDifficulty || item.difficulty === bankDifficulty)).slice(0, bankCount).map((item) => <p key={item.id} className="border-b border-line pb-2 last:border-0">{item.question}</p>)}
                  </div>
                ) : <p className="text-sm text-muted">Không có câu phù hợp. <a className="font-semibold text-brand" href="/question-bank">Thêm câu hỏi</a> hoặc <a className="font-semibold text-brand" href="/tools/import-questions">nhập từ text/CSV</a>.</p>}
              </> : null}
            </div>
            <div><label className="label">Yêu cầu thêm</label><textarea className="form-field mt-1 min-h-24" value={input.extraRequirements} onChange={(e) => setInput({ ...input, extraRequirements: e.target.value })} /></div>
            <div className="tool-tip-card"><p className="font-bold text-blue-800">Mẹo trước khi tạo</p><p className="mt-1">Kiểm tra tổng tỉ lệ nhận thức bằng 100% và chọn đúng phần cần xuất để file Word gọn hơn.</p></div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo đề kiểm tra"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          }
          output={
            <ToolOutputPanel loading={loading} loadingTitle="Đang tạo đề kiểm tra..." loadingDescription="Soạn Lab đang soạn bản nháp có đáp án, thang điểm và ma trận." hasOutput={Boolean(document)} showWarning={false}>
              {document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool="exam" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
              ) : null}
            </ToolOutputPanel>
          }
        />
    </AppShell>
  );
}
