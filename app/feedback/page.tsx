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
  const [feedbackType, setFeedbackType] = useState("Lỗi giao diện");
  const [tool, setTool] = useState("");
  const [usefulTool, setUsefulTool] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get("source");
    queueMicrotask(() => {
      if (source) setTool(source);
      setPageUrl(window.location.pathname);
    });
  }, []);

  async function handleCopy(event: FormEvent) {
    event.preventDefault();
    const browserNote = `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`;
    const feedback = `GÓP Ý SẢN PHẨM SOẠN LAB

Họ tên: ${name || "Chưa nhập"}
Vai trò: ${role}
Thời gian: ${new Date().toLocaleString("vi-VN")}
Loại góp ý: ${feedbackType}
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

  return <main className="warm-page min-h-screen"><Navbar /><section className="mx-auto max-w-5xl px-4 py-10 md:py-14"><div className="hero-gradient mb-8 rounded-[30px] p-6 text-white shadow-[0_18px_44px_rgba(37,99,235,.18)] sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-200">Góp ý sản phẩm</p><h1 className="mt-3 text-3xl font-black md:text-5xl">Góp ý cho Soạn Lab</h1><p className="mt-4 max-w-3xl leading-7 text-blue-100">Thầy cô hãy giúp đánh giá độ dễ dùng, quy trình và chất lượng file Word/PDF để Soạn Lab ngày càng hữu ích hơn.</p></div>
    <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]"><aside className="play-card h-fit p-5 sm:p-6"><h2 className="text-lg font-extrabold text-ink">Nên góp ý về điều gì?</h2><ol className="mt-4 space-y-2 text-sm leading-6 text-muted"><li>1. Giao diện có dễ dùng không?</li><li>2. Công cụ nào hữu ích nhất?</li><li>3. File Word/PDF có đủ dùng không?</li><li>4. Output có đúng cấu trúc mong muốn không?</li><li>5. Có lỗi nào khi thao tác không?</li></ol><div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><div className="flex gap-2"><MessageCircle size={16} className="mt-0.5 shrink-0" /><p>Thông tin chỉ được sao chép, không gửi lên server.</p></div></div></aside>
      <form onSubmit={handleCopy} className="play-card space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Họ tên</label><input className="form-field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Cô Lan" /></div><div><label className="label">Vai trò</label><select className="form-field mt-1" value={role} onChange={(e) => setRole(e.target.value)}><option>Giáo viên</option><option>Gia sư</option><option>Học sinh</option><option>Khác</option></select></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Email hoặc Zalo (không bắt buộc)</label><input className="form-field mt-1" value={contact} onChange={(e) => setContact(e.target.value)} /></div><div><label className="label">Link trang đang gặp lỗi (không bắt buộc)</label><input className="form-field mt-1" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} placeholder="/tools/exam-generator" /></div></div>
        <div><label className="label">Loại góp ý nhanh</label><div className="mt-2 flex flex-wrap gap-2">{["Lỗi giao diện", "Lỗi xuất Word", "Lỗi dữ liệu", "Công cụ khó dùng", "Ý tưởng tính năng", "Nội dung output chưa ổn"].map((type) => <button key={type} type="button" onClick={() => setFeedbackType(type)} className={feedbackType === type ? "btn-primary min-h-9 px-3 py-1 text-xs" : "btn-secondary min-h-9 px-3 py-1 text-xs"}>{type}</button>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Mức độ lỗi/góp ý</label><select className="form-field mt-1" value={severity} onChange={(e) => setSeverity(e.target.value)}><option>Góp ý chung</option><option>Lỗi nhỏ</option><option>Lỗi nghiêm trọng</option><option>Ý tưởng tính năng</option></select></div><div><label className="label">Công cụ liên quan</label><select className="form-field mt-1" value={tool} onChange={(e) => setTool(e.target.value)}><option value="">Chọn công cụ/trang</option><option>Dashboard</option><option>Lịch sử</option><option>Xuất Word</option>{toolRegistry.map((item) => <option key={item.href} value={item.href.replace("/tools/", "")}>{item.title}</option>)}</select></div></div>
        <div><label className="label">Công cụ hữu ích nhất</label><input className="form-field mt-1" value={usefulTool} onChange={(e) => setUsefulTool(e.target.value)} placeholder="Ví dụ: Tạo đề kiểm tra" /></div>
        <div><label className="label">Nội dung góp ý</label><textarea className="form-field mt-1 min-h-40" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Mô tả thao tác, kết quả hiện tại và kết quả bạn mong muốn..." /></div>
        <button type="submit" className="btn-primary w-full"><ClipboardCopy size={16} />Sao chép góp ý</button>{message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
      </form></div></section><SiteFooter /></main>;
}
