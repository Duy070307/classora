"use client";

import Link from "next/link";
import { FileClock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { clearAllFormDrafts, clearFormDraft, getAllFormDrafts, type FormDraft } from "@/lib/form-drafts";
import { draftToolNames } from "@/lib/draft-tool-names";
import { SoanLabEmptyState } from "@/components/ui/SoanLabEmptyState";

function preview(data: unknown) {
  try {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    return text.length > 150 ? `${text.slice(0, 150)}…` : text;
  } catch {
    return "Dữ liệu nháp";
  }
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<FormDraft[]>([]);
  const [query, setQuery] = useState("");
  const refresh = () => setDrafts(getAllFormDrafts());

  useEffect(() => queueMicrotask(refresh), []);

  const filtered = drafts.filter((draft) =>
    `${draftToolNames[draft.toolKey] || draft.toolKey} ${preview(draft.data)}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 p-5 md:p-8">
        <PageHeader title="Bản nháp biểu mẫu" description="Các thông tin đang nhập được Soạn Lab tự lưu tạm trên trình duyệt này." />
        {drafts.length ? (
          <>
            <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
              <input className="form-field" placeholder="Tìm bản nháp..." value={query} onChange={(event) => setQuery(event.target.value)} />
              <button
                className="btn-secondary shrink-0 text-red-600"
                onClick={() => {
                  if (window.confirm("Xóa toàn bộ bản nháp biểu mẫu?")) {
                    clearAllFormDrafts();
                    refresh();
                  }
                }}
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((draft) => (
                <article key={draft.toolKey} className="card p-4">
                  <div className="flex items-start gap-3">
                    <FileClock className="mt-1 shrink-0 text-brand" size={20} />
                    <div className="min-w-0">
                      <h2 className="font-bold text-ink">{draftToolNames[draft.toolKey] || draft.toolKey}</h2>
                      <p className="mt-1 text-xs text-muted">{new Date(draft.updatedAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>
                  <p className="mt-3 break-words text-sm leading-6 text-muted">{preview(draft.data)}</p>
                  <div className="mt-4 flex gap-2">
                    <Link href={draft.toolKey} className="btn-primary">
                      Mở tiếp
                    </Link>
                    <button
                      className="btn-secondary text-red-600"
                      onClick={() => {
                        clearFormDraft(draft.toolKey);
                        refresh();
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <SoanLabEmptyState title="Chưa có bản nháp nào" description="Khi bạn nhập thông tin trong các công cụ, Soạn Lab sẽ tự lưu tạm trên trình duyệt." />
        )}
      </main>
    </div>
  );
}
