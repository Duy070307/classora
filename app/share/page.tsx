"use client";

import Link from "next/link";
import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const shareMessage =
  "Em muốn giới thiệu Soạn Lab, một bộ công cụ hỗ trợ giáo viên tạo đề kiểm tra, phiếu học tập, giáo án, quản lý ngân hàng câu hỏi và xuất Word/PDF. Thầy/cô có thể chọn công cụ phù hợp, tạo một bản nháp tài liệu, xuất Word/PDF rồi rà soát và chỉnh sửa trước khi dùng.";

const flow = [
  "Chọn công cụ phù hợp",
  "Tạo một tài liệu",
  "Xuất Word hoặc PDF",
  "Rà soát và chỉnh sửa trước khi dùng",
];

export default function SharePage() {
  const [copied, setCopied] = useState<"message" | "link" | null>(null);

  async function copy(value: string, type: "message" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return (
    <main className="warm-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="rounded-xl bg-blue-700 p-6 text-white shadow-sm sm:p-9">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">Soạn Lab</span>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Chia sẻ Soạn Lab</h1>
          <p className="mt-4 max-w-2xl leading-7 text-blue-100">
            Mời đồng nghiệp khám phá các công cụ hỗ trợ soạn tài liệu dành cho giáo viên.
          </p>
        </div>

        <section className="play-card mt-8 overflow-hidden">
          <div className="border-b border-blue-100 bg-blue-50/60 px-5 py-4 text-sm font-extrabold text-blue-900">
            Tin nhắn giới thiệu Soạn Lab
          </div>
          <p className="break-words p-6 text-lg leading-8 text-slate-700">{shareMessage}</p>
          <div className="flex flex-col gap-3 border-t border-blue-100 bg-slate-50/70 p-5 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn-primary" onClick={() => copy(shareMessage, "message")}>
              {copied === "message" ? <Check size={17} /> : <Copy size={17} />}
              {copied === "message" ? "Đã sao chép" : "Sao chép tin nhắn"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => copy(window.location.href, "link")}>
              {copied === "link" ? <Check size={17} /> : <Link2 size={17} />}
              {copied === "link" ? "Đã sao chép" : "Sao chép liên kết"}
            </button>
          </div>
        </section>

        <section className="play-card mt-8 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-ink">Quy trình gợi ý</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {flow.map((item, index) => (
              <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          <Link href="/tools" className="btn-secondary">Công cụ</Link>
          <Link href="/tools/exam-generator" className="btn-secondary">Tạo đề kiểm tra</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
