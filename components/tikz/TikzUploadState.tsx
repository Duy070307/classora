"use client";

import Link from "next/link";
import {
  ClipboardPaste,
  Code2,
  FileImage,
  History,
  Library,
} from "lucide-react";

export function TikzUploadState({
  onFile,
  onPasteHelp,
  manualSource,
  onManualSourceChange,
  onOpenManualSource,
  geometryMode = true,
}: {
  onFile: (file: File | null) => void;
  onPasteHelp: () => void;
  manualSource: string;
  onManualSourceChange: (value: string) => void;
  onOpenManualSource: () => void;
  geometryMode?: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <label
        className="mx-auto flex min-h-72 max-w-4xl cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onFile(event.dataTransfer.files.item(0));
        }}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          <FileImage size={28} aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-black text-slate-950 sm:text-2xl">
          {geometryMode
            ? "Tải hoặc dán ảnh hình học"
            : "Tải hoặc dán ảnh công thức"}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {geometryMode
            ? "Cắt ảnh chỉ còn phần hình cần dựng để kết quả chính xác hơn."
            : "Cắt ảnh chỉ còn phần công thức cần nhận diện để kết quả chính xác hơn."}
        </p>
        <span className="btn-primary mt-5">Chọn ảnh</span>
        <span className="mt-3 text-xs font-semibold text-slate-500">
          PNG, JPG, JPEG, WEBP · tối đa 10 MB
        </span>
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => onFile(event.target.files?.item(0) || null)}
        />
      </label>

      <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-2">
        <button type="button" className="btn-secondary" onClick={onPasteHelp}>
          <ClipboardPaste size={16} aria-hidden="true" />
          Dán từ clipboard
        </button>
        <Link href="/history" className="btn-secondary">
          <History size={16} aria-hidden="true" />
          Mở TikZ đã lưu
        </Link>
        <Link href="/tikz-bank" className="btn-secondary">
          <Library size={16} aria-hidden="true" />
          Dùng mẫu từ Ngân hàng TikZ
        </Link>
      </div>

      <details className="mx-auto mt-4 max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-900">
          Mẹo để nhận diện tốt hơn
        </summary>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600 sm:grid-cols-2">
          <ul className="space-y-1">
            <li>• Cắt sát phần hình cần nhận diện.</li>
            <li>• Dùng ảnh rõ nét, tránh nghiêng mạnh.</li>
            <li>• Phù hợp với tam giác, đường tròn và hình tọa độ.</li>
          </ul>
          <ul className="space-y-1">
            <li>• Tránh nhiều hình trong cùng một ảnh.</li>
            <li>• Tránh ảnh có đề bài dài hoặc bị che khuất.</li>
            <li>• Ảnh chứa nhiều nội dung ngoài hình có thể giảm độ chính xác.</li>
          </ul>
        </div>
      </details>

      <details className="mx-auto mt-3 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-black text-slate-900">
          Nhập mã TikZ có sẵn
        </summary>
        <textarea
          className="form-field mt-3 min-h-32 font-mono text-xs"
          value={manualSource}
          onChange={(event) => onManualSourceChange(event.target.value)}
          placeholder="Dán khối tikzpicture hoặc nhập mô tả hình cơ bản…"
        />
        <button
          type="button"
          className="btn-secondary mt-2"
          onClick={onOpenManualSource}
        >
          <Code2 size={16} aria-hidden="true" />
          Mở trong trình rà soát
        </button>
      </details>
    </section>
  );
}
