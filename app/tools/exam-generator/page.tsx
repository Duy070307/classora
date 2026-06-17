"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { FormEvent, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { ExportDocxButton } from "@/components/ExportDocxButton";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { createDocument, saveDocument } from "@/lib/history";
import { generateExam } from "@/lib/mock-ai";
import type { ExamInput, GeneratedDocument } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";

const initialInput: ExamInput = {
  subject: "Toán",
  grade: "7",
  topic: "Tỉ lệ thức và dãy tỉ số bằng nhau",
  duration: "45 phút",
  examType: "Kết hợp",
  multipleChoiceCount: 8,
  essayCount: 3,
  totalScore: 10,
  level: "Trung bình",
  includeAnswers: true,
  includeRubric: true,
  includeMatrix: true,
  extraRequirements: ""
};

export default function ExamGeneratorPage() {
  const [input, setInput] = useState(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await generate();
  }

  async function generate() {
    setLoading(true);
    setMessage("");
    const content = await generateExam(input);
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

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Tạo đề kiểm tra" description="Nhập yêu cầu, Classora sẽ tạo bản nháp đề kiểm tra kèm đáp án, thang điểm và ma trận." />
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-5 p-5">
            <div className="form-section">
              <p className="form-section-title">Thông tin đề</p>
              <div className="space-y-4">
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
                <div><label className="label">Loại đề</label><select className="form-field mt-1" value={input.examType} onChange={(e) => setInput({ ...input, examType: e.target.value as ExamInput["examType"] })}><option>Trắc nghiệm</option><option>Tự luận</option><option>Kết hợp</option></select></div>
                <div><label className="label">Mức độ</label><select className="form-field mt-1" value={input.level} onChange={(e) => setInput({ ...input, level: e.target.value as ExamInput["level"] })}><option>Dễ</option><option>Trung bình</option><option>Khó</option></select></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div><label className="label">Số câu trắc nghiệm</label><input type="number" className="form-field mt-1" value={input.multipleChoiceCount} onChange={(e) => setInput({ ...input, multipleChoiceCount: Number(e.target.value) })} /></div>
                <div><label className="label">Số câu tự luận</label><input type="number" className="form-field mt-1" value={input.essayCount} onChange={(e) => setInput({ ...input, essayCount: Number(e.target.value) })} /></div>
                <div><label className="label">Tổng điểm</label><input type="number" className="form-field mt-1" value={input.totalScore} onChange={(e) => setInput({ ...input, totalScore: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div className="form-section space-y-3">
              <p className="form-section-title">Nội dung kèm theo</p>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeAnswers} onChange={(e) => setInput({ ...input, includeAnswers: e.target.checked })} /> Có tạo đáp án không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeRubric} onChange={(e) => setInput({ ...input, includeRubric: e.target.checked })} /> Có tạo thang điểm không</label>
              <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={input.includeMatrix} onChange={(e) => setInput({ ...input, includeMatrix: e.target.checked })} /> Có tạo ma trận đề không</label>
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
                  <p className="mt-1 text-sm text-muted">Classora đang soạn bản nháp có đáp án, thang điểm và ma trận.</p>
                </div>
              </div>
            ) : document ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={document.content} />
                  <button type="button" onClick={handleSave} className="btn-secondary"><Save size={16} />Save to history</button>
                  <ExportDocxButton document={document} />
                  <button type="button" onClick={generate} className="btn-secondary"><RotateCcw size={16} />Generate again</button>
                </div>
                <OutputPreview document={document} />
              </>
            ) : <div className="card p-8 text-sm text-muted">Kết quả sẽ hiển thị tại đây sau khi tạo.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
