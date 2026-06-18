"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputPreview } from "@/components/OutputPreview";
import { ToolPageHeader as PageHeader } from "@/components/tools/ToolPageHeader";
import { Sidebar } from "@/components/Sidebar";
import { TemplateSelect } from "@/components/TemplateSelect";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { useFormDraft } from "@/hooks/useFormDraft";
import { examPresets } from "@/lib/presets";
import { createDocument, saveDocument } from "@/lib/history";
import { generateExam } from "@/lib/mock-ai";
import { getDocumentSettings } from "@/lib/document-settings";
import { getQuestions } from "@/lib/question-bank";
import { applyTemplate, resolveTemplate } from "@/lib/templates";
import type { ExamInput, GeneratedDocument, QuestionItem } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { sampleExamInput } from "@/lib/sample-data";

const initialInput: ExamInput = {
  schoolName: "",
  teacherName: "",
  subject: "Toán",
  grade: "7",
  topic: "Tỉ lệ thức và dãy tỉ số bằng nhau",
  duration: "45 phút",
  examType: "Kết hợp",
  multipleChoiceCount: 8,
  essayCount: 3,
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
  const draft = useFormDraft("/tools/exam-generator", input, setInput);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  async function generate() {
    if (!input.subject.trim()) return setMessage("Vui lòng nhập môn học.");
    if (!input.grade.trim()) return setMessage("Vui lòng nhập lớp.");
    if (input.multipleChoiceCount + input.essayCount <= 0) return setMessage("Tổng số câu phải lớn hơn 0.");
    if ([input.recognitionRate, input.understandingRate, input.applicationRate, input.advancedRate].reduce((a, b) => a + b, 0) !== 100) return setMessage("Tổng tỉ lệ mức độ nên bằng 100%.");
    setLoading(true);
    setMessage("");
    const generatedRaw = await generateExam(input);
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
    setDocument(next);
    incrementUsage();
    setMessage("Đã tạo đề kiểm tra thành công.");
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
    setMessage("Đã tinh chỉnh nội dung bằng Mock AI.");
  }

  function useSampleData() {
    const settings = getDocumentSettings();
    setInput({ ...sampleExamInput, schoolName: settings.schoolName || sampleExamInput.schoolName, teacherName: settings.teacherName || sampleExamInput.teacherName });
    setMessage("Đã điền dữ liệu mẫu.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Tạo đề kiểm tra" description="Nhập yêu cầu, Soạn Lab sẽ tạo bản nháp đề kiểm tra kèm đáp án, thang điểm và ma trận." />
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="tool-form-card">
            <button type="button" onClick={useSampleData} className="btn-secondary w-full">Dùng dữ liệu mẫu</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <PresetSelect presets={examPresets} onApply={(values) => setInput((current) => ({ ...current, ...values }))} />
            <TemplateSelect type="Đề kiểm tra" value={templateId} onChange={setTemplateId} />
            <div className="form-section">
              <p className="form-section-title">Thông tin đề</p>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Tên trường/trung tâm</label><input className="form-field mt-1" value={input.schoolName} onChange={(e) => setInput({ ...input, schoolName: e.target.value })} /></div>
                  <div><label className="label">Tên giáo viên</label><input className="form-field mt-1" value={input.teacherName} onChange={(e) => setInput({ ...input, teacherName: e.target.value })} /></div>
                </div>
                <div><label className="label">Môn học</label><input className="form-field mt-1" value={input.subject} onChange={(e) => setInput({ ...input, subject: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.grade} onChange={(e) => setInput({ ...input, grade: e.target.value })} /></div>
                  <div><label className="label">Thời gian làm bài</label><input className="form-field mt-1" value={input.duration} onChange={(e) => setInput({ ...input, duration: e.target.value })} /></div>
                </div>
                <div><label className="label">Chủ đề/chương</label><input className="form-field mt-1" value={input.topic} onChange={(e) => setInput({ ...input, topic: e.target.value })} /></div>
              </div>
            </div>
            <div className="form-section">
              <p className="form-section-title">Cấu trúc</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Hình thức đề</label><select className="form-field mt-1" value={input.examType} onChange={(e) => setInput({ ...input, examType: e.target.value as ExamInput["examType"] })}><option>Trắc nghiệm</option><option>Tự luận</option><option>Kết hợp</option></select></div>
                <div><label className="label">Mức độ chung</label><select className="form-field mt-1" value={input.level} onChange={(e) => setInput({ ...input, level: e.target.value as ExamInput["level"] })}><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div><label className="label">Số câu trắc nghiệm</label><input type="number" className="form-field mt-1" value={input.multipleChoiceCount} onChange={(e) => setInput({ ...input, multipleChoiceCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu tự luận</label><input type="number" className="form-field mt-1" value={input.essayCount} onChange={(e) => setInput({ ...input, essayCount: Number(e.target.value) })} /></div>
                <div><label className="label">Tổng điểm</label><input type="number" className="form-field mt-1" value={input.totalScore} onChange={(e) => setInput({ ...input, totalScore: Number(e.target.value) })} /></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div><label className="label">Tỉ lệ nhận biết</label><input type="number" className="form-field mt-1" value={input.recognitionRate} onChange={(e) => setInput({ ...input, recognitionRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ thông hiểu</label><input type="number" className="form-field mt-1" value={input.understandingRate} onChange={(e) => setInput({ ...input, understandingRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng</label><input type="number" className="form-field mt-1" value={input.applicationRate} onChange={(e) => setInput({ ...input, applicationRate: Number(e.target.value) })} /></div>
                <div><label className="label">Tỉ lệ vận dụng cao</label><input type="number" className="form-field mt-1" value={input.advancedRate} onChange={(e) => setInput({ ...input, advancedRate: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Nội dung kèm theo</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeAnswers} onChange={(e) => setInput({ ...input, includeAnswers: e.target.checked })} /> Có tạo đáp án không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeRubric} onChange={(e) => setInput({ ...input, includeRubric: e.target.checked })} /> Có tạo thang điểm không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeMatrix} onChange={(e) => setInput({ ...input, includeMatrix: e.target.checked })} /> Có tạo ma trận đề không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeSpecification} onChange={(e) => setInput({ ...input, includeSpecification: e.target.checked })} /> Có bản đặc tả đề không</label>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Dùng câu hỏi từ ngân hàng</p>
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
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo đề kiểm tra"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          <div className="space-y-4">
            {loading ? (
              <div className="card flex min-h-80 items-center justify-center p-8 text-center">
                <div>
                  <Loader2 className="mx-auto animate-spin text-brand" size={34} />
                  <p className="mt-4 font-semibold text-ink">Đang tạo đề kiểm tra...</p>
                  <p className="mt-1 text-sm text-muted">Soạn Lab đang soạn bản nháp có đáp án, thang điểm và ma trận.</p>
                </div>
              </div>
            ) : document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool="exam" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
            ) : <div className="card p-8 text-sm text-muted">Kết quả sẽ hiển thị tại đây sau khi tạo.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
