"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { ToolOutputActions } from "@/components/ToolOutputActions";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { TemplateSelect } from "@/components/TemplateSelect";
import { createDocument, saveDocument } from "@/lib/history";
import { generateWorksheet } from "@/lib/mock-ai";
import type { GeneratedDocument, WorksheetInput } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { applyTemplate, getTemplates } from "@/lib/templates";
import { sampleWorksheetInput } from "@/lib/sample-data";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";

const initialInput: WorksheetInput = {
  subject: "Ngữ văn",
  grade: "6",
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

  async function generate() {
    setLoading(true);
    setMessage("");
    const generated = await generateWorksheet(input);
    const content = applyTemplate(getTemplates().find((item) => item.id === templateId), generated, { subject: input.subject, grade: input.grade, topic: input.topic });
    const next = createDocument(`Phiếu học tập ${input.subject} lớp ${input.grade}`, "worksheet", content);
    setDocument(next);
    incrementUsage();
    setMessage("Đã tạo phiếu học tập thành công.");
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
    setDocument({ ...document, content });
    setMessage("Đã tinh chỉnh nội dung bằng Mock AI.");
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Tạo phiếu học tập" description="Tạo nhanh phiếu học tập có mục tiêu, tóm tắt kiến thức, bài tập và đáp án." />
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-5 p-5">
            <button type="button" className="btn-secondary w-full" onClick={() => { setInput(sampleWorksheetInput); setMessage("Đã điền dữ liệu mẫu."); }}>Dùng dữ liệu mẫu</button>
            <TemplateSelect type="Phiếu học tập" value={templateId} onChange={setTemplateId} />
            <div className="form-section space-y-4">
              <p className="form-section-title">Thông tin phiếu</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Môn học</label><input className="form-field mt-1" value={input.subject} onChange={(e) => setInput({ ...input, subject: e.target.value })} /></div>
              <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.grade} onChange={(e) => setInput({ ...input, grade: e.target.value })} /></div>
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
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo phiếu học tập"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          <div className="space-y-4">
            {loading ? (
              <div className="card flex min-h-80 items-center justify-center p-8 text-center">
                <div>
                  <Loader2 className="mx-auto animate-spin text-brand" size={34} />
                  <p className="mt-4 font-semibold text-ink">Đang tạo phiếu học tập...</p>
                  <p className="mt-1 text-sm text-muted">Classora đang chuẩn bị mục tiêu, kiến thức cần nhớ và bài tập.</p>
                </div>
              </div>
            ) : document ? (
              <>
                <ToolOutputActions document={document} onSave={handleSave} onGenerateAgain={generate} />
                <OutputRefinementBar tool="worksheet" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
            ) : <div className="card p-8 text-sm text-muted">Kết quả sẽ hiển thị tại đây sau khi tạo.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
