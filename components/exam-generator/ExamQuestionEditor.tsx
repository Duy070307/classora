"use client";

import { useMemo, useRef, useState } from "react";
import { generateToolContent } from "@/lib/ai/client";
import { auditStructuredExam } from "@/lib/exam-audit/audit";
import { auditConfigFromDocument, withAuditResult } from "@/lib/exam-audit/document";
import type { ExamQuestion } from "@/lib/exam-types";
import { buildSectionOnlyInput } from "@/lib/exam/section-generation";
import { applyQuestionReplacement, confirmExamQuestion, editExamQuestion, proposeQuestionReplacement, type QuestionReplacementProposal } from "@/lib/exam/question-workflow";
import type { ExamInput, GeneratedDocument } from "@/lib/types";

type Props = { document: GeneratedDocument; input: ExamInput; onChange: (document: GeneratedDocument) => void };

function questionLabel(question: ExamQuestion) {
  return `${question.part === "multiple_choice" ? "PHẦN I" : question.part === "true_false" ? "PHẦN II" : "PHẦN III"} · Câu ${question.number}`;
}

export function ExamQuestionEditor({ document, input, onChange }: Props) {
  const questions = useMemo(() => document.structuredExam?.parts.flatMap((part) => part.questions) || [], [document.structuredExam]);
  const [selectedId, setSelectedId] = useState(questions[0]?.id || "");
  const selected = questions.find((question) => question.id === selectedId) || questions[0];
  const [draft, setDraft] = useState<ExamQuestion | null>(null);
  const [proposal, setProposal] = useState<QuestionReplacementProposal | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const requestLock = useRef(false);
  if (!selected || !document.structuredExam) return null;

  function startEdit(answerOnly = false) {
    setDraft(JSON.parse(JSON.stringify(selected)) as ExamQuestion);
    setProposal(null);
    setMessage(answerOnly ? "Chỉnh đáp án rồi bấm Lưu thay đổi." : "Đang chỉnh câu đã chọn. Mã câu và vị trí sẽ được giữ nguyên.");
  }

  function saveEdit() {
    if (!draft) return;
    onChange(editExamQuestion(document, selected.id, draft));
    setDraft(null);
    setMessage("Đã cập nhật câu hỏi. Kết quả kiểm tra và lời giải cũ của riêng câu này đã được làm mới.");
  }

  async function regenerate() {
    if (requestLock.current) return;
    requestLock.current = true; setBusy(true); setMessage("Đang tạo phương án thay thế. Câu hiện tại vẫn được giữ nguyên.");
    try {
      const existingStems = questions.filter((question) => question.id !== selected.id).map((question) => question.stem);
      const sectionInput = buildSectionOnlyInput({
        ...input,
        extraRequirements: `${input.extraRequirements}\nTạo một câu thay thế cho ${questionLabel(selected)}. Giữ chủ đề ${selected.topic}, mức độ ${selected.cognitiveLevel || selected.difficulty}. Không lặp các câu còn lại.`,
      }, selected.part, 1, existingStems);
      const result = await generateToolContent({ tool: "exam", input: sectionInput });
      const candidate = result.structuredExam?.parts.find((part) => part.type === selected.part)?.questions[0];
      if (!candidate) throw new Error("missing_replacement");
      setProposal(proposeQuestionReplacement(document.structuredExam!, selected.id, candidate));
      setDraft(null);
      setMessage("Đã tạo phương án thay thế. Vui lòng xem trước và xác nhận trước khi áp dụng.");
    } catch {
      setMessage("Không thể tạo lại câu này. Nội dung cũ vẫn được giữ nguyên.");
    } finally { requestLock.current = false; setBusy(false); }
  }

  function checkQuestion() {
    const result = auditStructuredExam(document.structuredExam!, auditConfigFromDocument(document));
    onChange(withAuditResult(document, result, document.auditMeta?.acceptedWarningIds));
    const own = result.issues.filter((issue) => issue.questionId === selected.id);
    setMessage(own.length ? `${questionLabel(selected)} có ${own.length} vấn đề: ${own.map((issue) => issue.title).join("; ")}.` : `${questionLabel(selected)} chưa có lỗi cấu trúc xác định được. Giáo viên vẫn cần rà soát chuyên môn.`);
  }

  function confirmQuestion() {
    onChange(confirmExamQuestion(document, selected.id));
    setMessage(`Đã ghi nhận giáo viên xác nhận ${questionLabel(selected)}.`);
  }

  return (
    <details className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Sửa từng câu hỏi</summary>
      <div className="mt-4 space-y-4">
        <div>
          <label className="label" htmlFor="exam-question-editor-select">Chọn câu</label>
          <select id="exam-question-editor-select" className="form-field mt-1" value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setDraft(null); setProposal(null); setMessage(""); }}>
            {questions.map((question) => <option key={question.id} value={question.id}>{questionLabel(question)} · {question.stem.slice(0, 80)}</option>)}
          </select>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6">
          <p className="font-semibold text-slate-900">{questionLabel(selected)}</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.stem}</p>
          {selected.options ? <div className="mt-2 grid gap-1 sm:grid-cols-2">{Object.entries(selected.options).map(([key, value]) => <p key={key}><strong>{key}.</strong> {value}</p>)}</div> : null}
          <p className="mt-2 text-slate-700"><strong>Đáp án:</strong> {selected.answer}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => startEdit(false)}>Chỉnh sửa</button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={regenerate}>{busy ? "Đang tạo..." : "Tạo lại câu này"}</button>
          <button type="button" className="btn-secondary" onClick={checkQuestion}>Kiểm tra câu này</button>
          <button type="button" className="btn-secondary" onClick={() => startEdit(true)}>Thay đáp án</button>
          <button type="button" className="btn-secondary" onClick={confirmQuestion}>Xác nhận câu</button>
        </div>
        {draft ? <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div><label className="label">Nội dung câu hỏi</label><textarea className="form-field mt-1 min-h-24" value={draft.stem} onChange={(event) => setDraft({ ...draft, stem: event.target.value })} /></div>
          {draft.options ? <div className="grid gap-2 sm:grid-cols-2">{(["A", "B", "C", "D"] as const).map((key) => <div key={key}><label className="label">Phương án {key}</label><input className="form-field mt-1" value={draft.options?.[key] || ""} onChange={(event) => setDraft({ ...draft, options: { ...draft.options!, [key]: event.target.value } })} /></div>)}</div> : null}
          {draft.trueFalseItems ? <div className="space-y-2">{draft.trueFalseItems.map((item, index) => <div key={item.id || item.label} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><div><label className="label">Mệnh đề {item.label}</label><input className="form-field mt-1" value={item.text} onChange={(event) => setDraft({ ...draft, trueFalseItems: draft.trueFalseItems?.map((current, itemIndex) => itemIndex === index ? { ...current, text: event.target.value } : current) })} /></div><label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium"><input type="checkbox" checked={item.answer} onChange={(event) => setDraft({ ...draft, trueFalseItems: draft.trueFalseItems?.map((current, itemIndex) => itemIndex === index ? { ...current, answer: event.target.checked } : current) })} />Đúng</label></div>)}</div> : null}
          <div><label className="label">Đáp án</label><input className="form-field mt-1" value={draft.answer} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} /></div>
          <div><label className="label">Giải thích</label><textarea className="form-field mt-1 min-h-20" value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} /></div>
          <div className="flex gap-2"><button type="button" className="btn-primary" onClick={saveEdit}>Lưu thay đổi</button><button type="button" className="btn-secondary" onClick={() => setDraft(null)}>Hủy</button></div>
        </div> : null}
        {proposal ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6">
          <p className="font-semibold text-amber-950">Phương án thay thế — chưa áp dụng</p>
          <p className="mt-2 whitespace-pre-wrap text-slate-800">{proposal.replacement.stem}</p>
          <p className="mt-2"><strong>Đáp án dự kiến:</strong> {proposal.replacement.answer}</p>
          <div className="mt-3 flex gap-2"><button type="button" className="btn-primary" onClick={() => { onChange(applyQuestionReplacement(document, proposal)); setProposal(null); setMessage("Đã áp dụng phương án thay thế và giữ nguyên mã câu, vị trí, điểm số."); }}>Áp dụng thay thế</button><button type="button" className="btn-secondary" onClick={() => setProposal(null)}>Giữ câu cũ</button></div>
        </div> : null}
        {message ? <p className="text-sm text-slate-700" role="status">{message}</p> : null}
      </div>
    </details>
  );
}
