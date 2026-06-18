"use client";

import { ClipboardCopy, MessageCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { toolRegistry } from "@/lib/tool-registry";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Giáo viên");
  const [contact, setContact] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [severity, setSeverity] = useState("Góp ý chung");
  const [tool, setTool] = useState("");
  const [usefulTool, setUsefulTool] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    if (source) queueMicrotask(() => setTool(source));
  }, []);

  async function handleCopy(event: FormEvent) {
    event.preventDefault();
    const browserNote = `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`;
    const feedback = `GÓP Ý PRIVATE BETA CLASSORA

Họ tên: ${name || "Chưa nhập"}
Vai trò: ${role}
Email/Zalo: ${contact || "Không cung cấp"}
Công cụ/trang liên quan: ${tool || "Chưa chọn"}
Link trang gặp lỗi: ${pageUrl || "Không có"}
Công cụ hữu ích nhất: ${usefulTool || "Chưa nhập"}
Mức độ: ${severity}

Nội dung góp ý:
${content || "Chưa nhập"}

Thông tin trình duyệt:
${browserNote}`;
    try {
      await navigator.clipboard.writeText(feedback);
      setMessage("Đã sao chép góp ý. Vui lòng gửi thủ công cho Trần Đức Duy qua Zalo, Facebook hoặc email.");
    } catch {
      setMessage("Không thể sao chép tự động. Vui lòng chọn và sao chép nội dung thủ công.");
    }
  }

  return <main className="min-h-screen"><Navbar /><section className="mx-auto max-w-5xl px-4 py-10 md:py-14"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-wide text-brand">Private beta feedback</p><h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">Góp ý cho Classora</h1><p className="mt-4 max-w-3xl leading-7 text-muted">Classora hiện là bản MVP/demo chưa sử dụng AI thật. Góp ý của thầy cô giúp đánh giá độ dễ dùng, workflow và chất lượng file Word trước khi phát triển bản beta.</p></div>
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><aside className="card p-5"><h2 className="text-lg font-bold text-ink">Nên góp ý về điều gì?</h2><ol className="mt-4 space-y-3 text-sm leading-6 text-muted"><li>1. Giao diện có dễ dùng không?</li><li>2. Công cụ nào hữu ích nhất?</li><li>3. File Word có đủ dùng không?</li><li>4. Output có đúng cấu trúc mong muốn không?</li><li>5. Có lỗi nào khi thao tác không?</li></ol><div className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800"><div className="flex gap-2"><MessageCircle size={16} className="mt-0.5 shrink-0" /><p>Thông tin chỉ được sao chép vào clipboard, không lưu vào localStorage hay gửi lên server.</p></div></div></aside>
      <form onSubmit={handleCopy} className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Họ tên</label><input className="form-field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Cô Lan" /></div><div><label className="label">Vai trò</label><select className="form-field mt-1" value={role} onChange={(e) => setRole(e.target.value)}><option>Giáo viên</option><option>Gia sư</option><option>Học sinh</option><option>Khác</option></select></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Email hoặc Zalo (không bắt buộc)</label><input className="form-field mt-1" value={contact} onChange={(e) => setContact(e.target.value)} /></div><div><label className="label">Link trang đang gặp lỗi (không bắt buộc)</label><input className="form-field mt-1" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="/tools/exam-generator" /></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Mức độ lỗi/góp ý</label><select className="form-field mt-1" value={severity} onChange={(e) => setSeverity(e.target.value)}><option>Góp ý chung</option><option>Lỗi nhỏ</option><option>Lỗi nghiêm trọng</option><option>Ý tưởng tính năng</option></select></div><div><label className="label">Công cụ liên quan</label><select className="form-field mt-1" value={tool} onChange={(e) => setTool(e.target.value)}><option value="">Chọn công cụ/trang</option><option>Dashboard</option><option>Lịch sử</option><option>Xuất Word</option>{toolRegistry.map((item) => <option key={item.href} value={item.href.replace("/tools/", "")}>{item.title}</option>)}</select></div></div>
        <div><label className="label">Công cụ hữu ích nhất</label><input className="form-field mt-1" value={usefulTool} onChange={(e) => setUsefulTool(e.target.value)} placeholder="Ví dụ: Tạo đề kiểm tra" /></div>
        <div><label className="label">Nội dung góp ý</label><textarea className="form-field mt-1 min-h-40" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mô tả thao tác, kết quả hiện tại và kết quả bạn mong muốn..." /></div>
        <button type="submit" className="btn-primary w-full"><ClipboardCopy size={16} />Sao chép góp ý</button>{message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </form></div></section><SiteFooter /></main>;
}
