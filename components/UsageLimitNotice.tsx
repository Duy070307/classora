"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function UsageLimitNotice() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener("classora-limit-reached", show);
    return () => window.removeEventListener("classora-limit-reached", show);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-lg rounded-lg border border-amber-200 bg-white p-4 shadow-xl">
      <button className="absolute right-3 top-3 text-muted" onClick={() => setOpen(false)} aria-label="Đóng"><X size={18} /></button>
      <p className="font-bold text-ink">Bạn đã dùng hết lượt tạo trong tháng này.</p>
      <p className="mt-1 text-sm leading-6 text-muted">Bạn vẫn có thể tiếp tục làm việc với dữ liệu đã lưu hoặc xem thông tin các gói sử dụng.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Link href="/pricing" className="btn-primary">Xem gói sử dụng</Link><button className="btn-secondary" onClick={() => setOpen(false)}>Đóng thông báo</button></div>
    </div>
  );
}
