"use client";

import { useState } from "react";
import { CheckCircle2, FileArchive, Upload, X } from "lucide-react";
import { parseTikzManifest } from "@/lib/tikz-bank/import-validation";

type PreviewRow = {
  index: number;
  title: string;
  subject: string | null;
  category: string | null;
  grade: string | null;
  package_dependencies: string[];
  tikz_code: string;
  validationStatus: "valid" | "warning" | "error";
  message: string;
  duplicate: boolean;
};

type Summary = { total: number; valid: number; warning: number; invalid: number; duplicate: number };

export function TikzBankImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => Promise<void> }) {
  const [filename, setFilename] = useState("");
  const [version, setVersion] = useState("");
  const [items, setItems] = useState<unknown[]>([]);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  async function chooseFile(file: File | null) {
    if (!file) return;
    setBusy(true); setError(""); setResult(""); setRows([]); setSummary(null);
    try {
      const manifest = await readManifest(file);
      const response = await fetch("/api/admin/tikz-bank/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "preview", filename: file.name, version: manifest.version, items: manifest.items }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; message?: string; rows?: PreviewRow[]; summary?: Summary } | null;
      if (!response.ok || !data?.success || !data.rows || !data.summary) throw new Error(data?.message || "Chưa đọc được bộ mã TikZ. Vui lòng kiểm tra tệp.");
      setFilename(file.name); setVersion(manifest.version); setItems(manifest.items); setRows(data.rows); setSummary(data.summary);
      setSelected(new Set(data.rows.filter((row) => row.validationStatus !== "error").map((row) => row.index)));
    } catch (readError) {
      if (process.env.NODE_ENV !== "production") console.error("TikZ Bank import parse error", readError);
      setError(readError instanceof Error ? readError.message : "Chưa đọc được bộ mã TikZ. Vui lòng kiểm tra tệp.");
    } finally { setBusy(false); }
  }

  async function importSelected() {
    const selectedItems = rows.filter((row) => selected.has(row.index) && row.validationStatus !== "error").map((row) => items[row.index]);
    if (!selectedItems.length) return setError("Vui lòng chọn ít nhất một mã hợp lệ để nhập.");
    setBusy(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/admin/tikz-bank/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "import", duplicateMode, filename, version, items: selectedItems }),
      });
      const data = await response.json().catch(() => null) as { success?: boolean; message?: string; inserted?: number; updated?: number; skipped?: number; invalid?: number } | null;
      if (!response.ok || !data?.success) throw new Error(data?.message || "Chưa nhập được bộ mã TikZ. Vui lòng thử lại.");
      setResult(`Đã nhập ${data.inserted || 0} mã TikZ, cập nhật ${data.updated || 0} mã, bỏ qua ${data.skipped || 0} mã trùng và loại ${data.invalid || 0} mã chưa hợp lệ.`);
      await onImported();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Chưa nhập được bộ mã TikZ. Vui lòng thử lại.");
    } finally { setBusy(false); }
  }

  function toggle(index: number) {
    setSelected((current) => { const next = new Set(current); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Nhập dữ liệu vào Ngân hàng TikZ">
    <div className="ui-dialog mx-auto my-5 max-w-5xl">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-950">Nhập dữ liệu vào Ngân hàng TikZ</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Tải lên bộ dữ liệu JSON hoặc ZIP đã được chuẩn bị. Hệ thống sẽ kiểm tra và cho phép xem trước trước khi nhập.</p></div><button type="button" onClick={onClose} aria-label="Đóng" className="ui-icon-button"><X size={20} /></button></div>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Chỉ nhập các bộ mã có nguồn và quyền sử dụng rõ ràng.</div>

      <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-5 text-center hover:border-emerald-400">
        <FileArchive className="text-emerald-700" size={30} /><span className="mt-3 font-black text-slate-900">Chọn tệp JSON hoặc ZIP</span><span className="mt-1 text-xs text-slate-500">JSON tối đa 5MB · ZIP tối đa 8MB</span>
        <input type="file" className="sr-only" accept=".json,.zip,application/json,application/zip" disabled={busy} onChange={(event) => { void chooseFile(event.target.files?.item(0) || null); event.target.value = ""; }} />
      </label>

      {busy ? <p className="mt-4 text-center text-sm font-bold text-emerald-800">Đang kiểm tra dữ liệu…</p> : null}
      {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700" role="alert">{error}</div> : null}
      {result ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800" role="status"><CheckCircle2 className="mr-2 inline" size={17} />{result}</div> : null}

      {summary ? <>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {[
            { label: "Tổng số mã", value: summary.total, className: "bg-slate-50" },
            { label: "Hợp lệ", value: summary.valid, className: "bg-emerald-50" },
            { label: "Cảnh báo", value: summary.warning, className: "bg-amber-50" },
            { label: "Lỗi", value: summary.invalid, className: "bg-red-50" },
            { label: "Trùng lặp", value: summary.duplicate, className: "bg-blue-50" },
          ].map((item) => <div key={item.label} className={`rounded-2xl p-3 text-center ${item.className}`}><p className="text-xs font-bold text-slate-500">{item.label}</p><p className="mt-1 text-xl font-black text-slate-950">{item.value}</p></div>)}
        </div>
        <div className="mt-5 max-h-[48vh] space-y-2 overflow-auto pr-1">
          {rows.map((row) => <article key={row.index} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4" checked={selected.has(row.index)} disabled={row.validationStatus === "error"} onChange={() => toggle(row.index)} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{row.title}</h3><Status value={row.validationStatus} />{row.duplicate ? <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">Trùng lặp</span> : null}</div><p className="mt-1 text-xs font-semibold text-slate-500">{[row.subject, row.category, row.grade ? `Lớp ${row.grade}` : "", row.package_dependencies.join(", ")].filter(Boolean).join(" · ") || "Chưa có metadata"}</p><p className="mt-2 text-sm text-slate-600">{row.message}</p><details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-blue-700">Xem mã</summary><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{row.tikz_code}</pre></details></div></div>
          </article>)}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-sm font-black text-slate-900">Xử lý mã đã tồn tại</p><div className="mt-2 flex flex-wrap gap-4 text-sm"><label className="font-bold"><input type="radio" className="mr-2" checked={duplicateMode === "skip"} onChange={() => setDuplicateMode("skip")} />Bỏ qua mã đã tồn tại</label><label className="font-bold"><input type="radio" className="mr-2" checked={duplicateMode === "update"} onChange={() => setDuplicateMode("update")} />Cập nhật mã đã tồn tại</label></div></div>
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className="btn-secondary" onClick={onClose}>Đóng</button><button type="button" className="btn-primary" disabled={busy || !selected.size} onClick={() => { void importSelected(); }}><Upload size={16} />Nhập {selected.size} mã đã chọn</button></div>
      </> : null}
    </div>
  </div>;
}

function Status({ value }: { value: PreviewRow["validationStatus"] }) {
  const styles = { valid: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", error: "bg-red-50 text-red-700" };
  const labels = { valid: "Hợp lệ", warning: "Cảnh báo", error: "Lỗi" };
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${styles[value]}`}>{labels[value]}</span>;
}

type ImportFile = Pick<File, "name" | "size" | "text" | "arrayBuffer">;

export async function readManifest(file: ImportFile) {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "json") {
    if (file.size > 5 * 1024 * 1024) throw new Error("Tệp JSON quá lớn. Vui lòng dùng tệp tối đa 5MB.");
    return parseJson(await file.text());
  }
  if (extension !== "zip") throw new Error("Vui lòng chọn tệp .json hoặc .zip.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Tệp ZIP quá lớn. Vui lòng dùng tệp tối đa 8MB.");
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files);
  if (entries.length > 2000) throw new Error("Tệp ZIP chứa quá nhiều mục.");
  for (const entry of entries) {
    const originalName = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName || entry.name;
    if (unsafeZipPath(originalName)) throw new Error("Tệp ZIP chứa đường dẫn không an toàn.");
  }
  const candidates = entries.filter((entry) => {
    if (entry.dir) return false;
    const parts = entry.name.replace(/\\/g, "/").split("/").filter(Boolean);
    return parts.length <= 2 && parts.at(-1)?.toLowerCase() === "tikz-bank.json";
  }).sort((a, b) => a.name.split("/").length - b.name.split("/").length);
  const manifestEntry = candidates[0];
  if (!manifestEntry) throw new Error("Không tìm thấy tikz-bank.json trong file ZIP.");
  const text = await manifestEntry.async("string");
  if (new TextEncoder().encode(text).byteLength > 5 * 1024 * 1024) throw new Error("Manifest trong ZIP quá lớn.");
  return parseJson(text);
}

function parseJson(text: string) {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("JSON không đúng cấu trúc."); }
  return parseTikzManifest(parsed);
}

function unsafeZipPath(name: string) {
  const normalized = name.replace(/\\/g, "/");
  return normalized.startsWith("/") || /^[a-z]:/i.test(normalized) || normalized.split("/").includes("..");
}
