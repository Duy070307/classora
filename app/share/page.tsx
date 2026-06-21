"use client";

import Link from "next/link";
import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const demoMessage = "Em đang phát triển Soạn Lab, một bộ công cụ hỗ trợ giáo viên tạo đề, ma trận đề, phiếu học tập, nhận xét học sinh và xuất Word. Bản hiện tại là MVP/demo, chưa dùng AI thật và chưa thu phí. Em muốn nhờ cô/thầy test thử quy trình sử dụng, đặc biệt là giao diện, xuất Word và các công cụ nào thực sự hữu ích.";

export default function SharePage() {
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  async function copy(value: string, type: "message" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }
  return <main className="warm-page min-h-screen"><Navbar /><section className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
    <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl shadow-blue-200 sm:p-9"><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">Private beta</span><h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Chia sẻ Soạn Lab</h1><p className="mt-4 max-w-2xl leading-7 text-blue-100">Mời giáo viên dùng thử bản demo và giúp Soạn Lab hiểu rõ hơn nhu cầu thực tế.</p></div>
    <section className="play-card mt-8 overflow-hidden"><div className="border-b border-blue-100 bg-blue-50/60 px-5 py-4 text-sm font-extrabold text-blue-900">Tin nhắn mời giáo viên dùng thử</div><p className="break-words p-6 text-lg leading-8 text-slate-700">{demoMessage}</p><div className="flex flex-col gap-3 border-t border-blue-100 bg-slate-50/70 p-5 sm:flex-row sm:flex-wrap">
      <button type="button" className="btn-primary" onClick={() => copy(demoMessage, "message")}>{copied === "message" ? <Check size={17} /> : <Copy size={17} />}{copied === "message" ? "Đã sao chép" : "Sao chép tin nhắn"}</button>
      <button type="button" className="btn-secondary" onClick={() => copy(window.location.href, "link")}>{copied === "link" ? <Check size={17} /> : <Link2 size={17} />}{copied === "link" ? "Đã sao chép" : "Sao chép liên kết"}</button>
    </div></section>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/feedback" className="btn-secondary">Mở góp ý</Link><Link href="/private-beta" className="btn-secondary">Private Beta</Link></div>
  </section><SiteFooter /></main>;
}
