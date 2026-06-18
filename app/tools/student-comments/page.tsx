"use client";

import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { DocumentExportMenu } from "@/components/tools/DocumentExportMenu";
import { OutputPreview } from "@/components/OutputPreview";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { TemplateSelect } from "@/components/TemplateSelect";
import { createDocument, saveDocument } from "@/lib/history";
import { generateStudentComments } from "@/lib/mock-ai";
import type { GeneratedDocument, StudentCommentInput } from "@/lib/types";
import { incrementUsage } from "@/lib/usage";
import { applyTemplate, getTemplates } from "@/lib/templates";
import { sampleStudentCommentInput } from "@/lib/sample-data";
import { OutputRefinementBar } from "@/components/tools/OutputRefinementBar";
import { FormDraftControls } from "@/components/tools/FormDraftControls";
import { PresetSelect } from "@/components/tools/PresetSelect";
import { useFormDraft } from "@/hooks/useFormDraft";
import { studentCommentPresets } from "@/lib/presets";

const initialInput: StudentCommentInput = {
  studentName: "Minh Anh",
  className: "7A1",
  role: "Giáo viên chủ nhiệm",
  performance: "Khá",
  attitude: "chủ động phát biểu và hợp tác với bạn trong giờ học",
  strengths: "tiếp thu bài tốt, trình bày vở cẩn thận",
  limitations: "cần luyện thêm kỹ năng tự kiểm tra bài làm",
  tone: "Nhẹ nhàng",
  purpose: "Nhận xét cuối kỳ"
};

function extractSection(content: string, heading: string) {
  const start = content.indexOf(heading);
  if (start === -1) return content;
  const rest = content.slice(start);
  const next = rest.slice(heading.length).search(/\nPHIÊN BẢN|\nNội dung do AI/);
  return next === -1 ? rest.trim() : rest.slice(0, heading.length + next).trim();
}

export default function StudentCommentsPage() {
  const [input, setInput] = useState(initialInput);
  const [document, setDocument] = useState<GeneratedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const draft = useFormDraft("/tools/student-comments", input, setInput);

  async function generate() {
    if (!input.studentName.trim()) return setMessage("Vui lòng nhập tên học sinh.");
    if (!input.className.trim()) return setMessage("Vui lòng nhập lớp.");
    if (!input.attitude.trim() && !input.strengths.trim() && !input.limitations.trim()) return setMessage("Vui lòng nhập ít nhất một nội dung nhận xét.");
    setLoading(true);
    setMessage("");
    const generated = await generateStudentComments(input);
    const content = applyTemplate(getTemplates().find((item) => item.id === templateId), generated, { className: input.className });
    const next = createDocument(`Nhận xét học sinh ${input.studentName || input.className}`, "student-comment", content);
    setDocument(next);
    incrementUsage();
    setMessage("Đã tạo nhận xét thành công.");
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
        <PageHeader title="Tạo nhận xét học sinh" description="Soạn nhận xét phù hợp học bạ, tin nhắn phụ huynh hoặc tổng kết cuối kỳ." />
        <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
          <form onSubmit={handleSubmit} className="card space-y-5 p-5">
            <button type="button" className="btn-secondary w-full" onClick={() => { setInput(sampleStudentCommentInput); setMessage("Đã điền dữ liệu mẫu."); }}>Dùng dữ liệu mẫu</button>
            <FormDraftControls updatedAt={draft.updatedAt} onRestore={draft.restoreDraft} onClear={draft.clearDraft} />
            <PresetSelect presets={studentCommentPresets} onApply={(values) => setInput((current) => ({ ...current, ...(values as Partial<StudentCommentInput>) }))} />
            <TemplateSelect type="Nhận xét học sinh" value={templateId} onChange={setTemplateId} />
            <div className="form-section space-y-4">
              <p className="form-section-title">Thông tin học sinh</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Tên học sinh</label><input className="form-field mt-1" value={input.studentName} onChange={(e) => setInput({ ...input, studentName: e.target.value })} /></div>
              <div><label className="label">Lớp</label><input className="form-field mt-1" value={input.className} onChange={(e) => setInput({ ...input, className: e.target.value })} /></div>
            </div>
            <div><label className="label">Vai trò</label><select className="form-field mt-1" value={input.role} onChange={(e) => setInput({ ...input, role: e.target.value as StudentCommentInput["role"] })}><option>Giáo viên bộ môn</option><option>Giáo viên chủ nhiệm</option></select></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Mức học tập</label><select className="form-field mt-1" value={input.performance} onChange={(e) => setInput({ ...input, performance: e.target.value as StudentCommentInput["performance"] })}><option>Tốt</option><option>Khá</option><option>Trung bình</option><option>Cần cố gắng</option></select></div>
              <div><label className="label">Giọng văn</label><select className="form-field mt-1" value={input.tone} onChange={(e) => setInput({ ...input, tone: e.target.value as StudentCommentInput["tone"] })}><option>Nhẹ nhàng</option><option>Trang trọng</option><option>Ngắn gọn</option><option>Chi tiết</option></select></div>
            </div>
            </div>
            <div className="form-section space-y-4">
              <p className="form-section-title">Nội dung nhận xét</p>
            <div><label className="label">Thái độ học tập</label><textarea className="form-field mt-1 min-h-20" value={input.attitude} onChange={(e) => setInput({ ...input, attitude: e.target.value })} /></div>
            <div><label className="label">Ưu điểm</label><textarea className="form-field mt-1 min-h-20" value={input.strengths} onChange={(e) => setInput({ ...input, strengths: e.target.value })} /></div>
            <div><label className="label">Hạn chế</label><textarea className="form-field mt-1 min-h-20" value={input.limitations} onChange={(e) => setInput({ ...input, limitations: e.target.value })} /></div>
            <div><label className="label">Mục đích</label><select className="form-field mt-1" value={input.purpose} onChange={(e) => setInput({ ...input, purpose: e.target.value as StudentCommentInput["purpose"] })}><option>Nhận xét học bạ</option><option>Tin nhắn phụ huynh</option><option>Nhận xét cuối kỳ</option></select></div>
            </div>
            <button className="btn-primary w-full" disabled={loading}>{loading ? "Đang tạo..." : "Tạo nhận xét"}</button>
            {message ? <p className="text-sm font-medium text-mint">{message}</p> : null}
          </form>
          <div className="space-y-4">
            {loading ? (
              <div className="card flex min-h-80 items-center justify-center p-8 text-center">
                <div>
                  <Loader2 className="mx-auto animate-spin text-brand" size={34} />
                  <p className="mt-4 font-semibold text-ink">Đang tạo nhận xét...</p>
                  <p className="mt-1 text-sm text-muted">Classora đang viết 3 phiên bản nhận xét phù hợp.</p>
                </div>
              </div>
            ) : document ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <CopyButton text={extractSection(document.content, "PHIÊN BẢN NGẮN GỌN")} label="Copy ngắn gọn" />
                  <CopyButton text={extractSection(document.content, "PHIÊN BẢN TRANG TRỌNG")} label="Copy trang trọng" />
                  <CopyButton text={extractSection(document.content, "PHIÊN BẢN THÂN THIỆN GỬI PHỤ HUYNH")} label="Copy phụ huynh" />
                  <DocumentExportMenu document={document} onSave={handleSave} />
                </div>
                <OutputRefinementBar tool="student-comments" input={input} currentContent={document.content} onRefined={handleRefined} />
                <OutputPreview document={document} />
              </>
            ) : <div className="card p-8 text-sm text-muted">Kết quả sẽ hiển thị tại đây sau khi tạo.</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
