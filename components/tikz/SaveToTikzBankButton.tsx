"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { tikzCategories } from "@/lib/tikz-bank";
import type { TikzDiagramDraft } from "@/lib/tikz/types";

export function SaveToTikzBankButton({ tikzCode, fullLatex, draft }: { tikzCode: string; fullLatex?: string; draft?: TikzDiagramDraft }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Hình TikZ từ ảnh");
  const [category, setCategory] = useState("Hình học phẳng");
  const [tags, setTags] = useState("hình học, từ ảnh");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (!title.trim() || !tikzCode.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const bankDraft = draft ? structuredClone(draft) : undefined;
      if (bankDraft) { delete bankDraft.source.localDataUrl; if (bankDraft.confirmedAsset) { delete bankDraft.confirmedAsset.svgDataUrl; delete bankDraft.confirmedAsset.pngDataUrl; } }
      const response = await fetch("/api/tikz-bank", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          description: "Mã TikZ được lưu từ công cụ Hình học → TikZ.",
          category,
          subject: "Toán",
          grade: "",
          tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
          tikz_code: tikzCode,
          full_latex: fullLatex || "",
          preview_note: note,
          source_type: "generated_from_image",
          metadata: draft ? { tikzDiagramDraft: bankDraft, currentVersion: draft.metadata.version, sourceAvailable: Boolean(draft.source.sourceAvailable), compilationStatus: draft.compilation.success ? "compiled" : draft.compilation.available ? "failed" : "unavailable", validationStatus: draft.validation.status, supportedInsertionTargets: ["exam", "question-bank", "worksheet", "lesson-plan", "lesson-slides", "review-pack", "answer-solutions"], lastConfirmedAt: draft.confirmedAsset?.confirmedAt } : undefined,
        }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) {
        setMessage(result?.error || "Chưa lưu được vào Ngân hàng TikZ. Vui lòng thử lại.");
        return;
      }
      setMessage("Đã lưu vào Ngân hàng TikZ.");
      window.setTimeout(() => setOpen(false), 900);
    } catch {
      setMessage("Chưa lưu được vào Ngân hàng TikZ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" disabled={!tikzCode} onClick={() => setOpen(true)} className="btn-secondary disabled:opacity-50"><Save size={16} />Lưu vào Ngân hàng TikZ</button>
      {open ? <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
        <div className="mx-auto my-16 max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">Lưu vào Ngân hàng TikZ</h2><p className="mt-1 text-sm text-slate-600">Mã được lưu vào ngân hàng cá nhân và cần rà soát trước khi dùng.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X size={19} /></button></div>
          <label className="mt-5 block text-sm font-bold text-slate-900">Tiêu đề<input className="form-field mt-1" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="mt-4 block text-sm font-bold text-slate-900">Danh mục<select className="form-field mt-1" value={category} onChange={(event) => setCategory(event.target.value)}>{tikzCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="mt-4 block text-sm font-bold text-slate-900">Tags<input className="form-field mt-1" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="tam giác, đường cao, hình học" /></label>
          <label className="mt-4 block text-sm font-bold text-slate-900">Ghi chú<textarea className="form-field mt-1 min-h-20" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} /></label>
          {message ? <p className={`mt-4 rounded-xl p-3 text-sm font-bold ${message.startsWith("Đã") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message}</p> : null}
          <div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Hủy</button><button type="button" className="btn-primary" disabled={busy || !title.trim()} onClick={() => { void save(); }}><Save size={16} />{busy ? "Đang lưu…" : "Lưu mã TikZ"}</button></div>
        </div>
      </div> : null}
    </>
  );
}
