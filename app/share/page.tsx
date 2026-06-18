"use client";

import Link from "next/link";
import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const demoMessage = "Em đang phát triển Classora, một bộ công cụ hỗ trợ giáo viên tạo đề, phiếu học tập, nhận xét học sinh, ma trận đề và xuất Word. Bản hiện tại là demo/MVP, chưa dùng AI thật. Em muốn nhờ cô/thầy dùng thử quy trình và góp ý xem công cụ nào hữu ích nhất.";

export default function SharePage() {
  const [copied, setCopied] = useState<"message" | "link" | null>(null);
  async function copy(value: string, type: "message" | "link") {
    await navigator.clipboard.writeText(value);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1800);
  }
  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
    <p className="text-sm font-bold uppercase tracking-wide text-brand">Private beta</p>
    <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Chia sẻ Classora</h1>
    <p className="mt-4 max-w-2xl leading-7 text-muted">Sao chép lời mời ngắn dưới đây để gửi bản demo cho giáo viên và thu thập góp ý về quy trình thực tế.</p>
    <section className="card mt-8 overflow-hidden"><div className="border-b border-line bg-slate-50 px-5 py-3 text-sm font-semibold text-ink">Tin nhắn demo gợi ý</div><p className="break-words p-5 leading-7 text-slate-700">{demoMessage}</p><div className="flex flex-col gap-3 border-t border-line p-5 sm:flex-row sm:flex-wrap">
      <button type="button" className="btn-primary" onClick={() => copy(demoMessage, "message")}>{copied === "message" ? <Check size={17} /> : <Copy size={17} />}{copied === "message" ? "Đã sao chép" : "Sao chép tin nhắn"}</button>
      <button type="button" className="btn-secondary" onClick={() => copy(window.location.href, "link")}>{copied === "link" ? <Check size={17} /> : <Link2 size={17} />}{copied === "link" ? "Đã sao chép" : "Sao chép liên kết"}</button>
    </div></section>
    <div className="mt-8 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-secondary">Dashboard</Link><Link href="/private-beta" className="btn-secondary">Private Beta</Link><Link href="/feedback" className="btn-primary">Gửi góp ý</Link></div>
  </section><SiteFooter /></main>;
}
