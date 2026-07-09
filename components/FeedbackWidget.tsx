"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle, Star, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { detectToolFromPath, FEEDBACK_CATEGORIES, FEEDBACK_RATING_LABELS } from "@/lib/feedback";

const LOCAL_FEEDBACK_KEY = "soanlab_local_feedback";

const toolOptions = [
  "Dashboard",
  "Soạn đề kiểm tra",
  "Phiếu học tập",
  "Giáo án",
  "Ngân hàng câu hỏi",
  "Ảnh công thức / hình học → LaTeX/TikZ",
  "Tạo mô phỏng 3D",
  "Lịch sử",
  "Công cụ",
  "Khác",
];

type AuthState = {
  supabaseConfigured: boolean;
  user: { email?: string; role?: string } | null;
};

export function FeedbackWidget() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(FEEDBACK_CATEGORIES[0]);
  const [tool, setTool] = useState("Dashboard");
  const [rating, setRating] = useState<number | null>(4);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const detectedTool = useMemo(() => detectToolFromPath(pathname || ""), [pathname]);
  const visible = auth ? (!auth.supabaseConfigured || Boolean(auth.user)) : false;

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setAuth({
          supabaseConfigured: Boolean(data?.supabaseConfigured),
          user: data?.user || null,
        });
      })
      .catch(() => setAuth({ supabaseConfigured: true, user: null }));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!visible) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setError("");
    setStatus("");
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return setError("Vui lòng nhập nội dung góp ý.");
    if (trimmedMessage.length > 3000) return setError("Nội dung góp ý quá dài. Vui lòng rút ngắn lại.");

    const payload = {
      category,
      tool,
      rating,
      message: trimmedMessage,
      contact: contact.trim(),
      path: pathname,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
    };

    setSending(true);
    try {
      if (auth && !auth.supabaseConfigured) {
        const current = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || "[]") as unknown[];
        localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify([{ ...payload, createdAt: new Date().toISOString() }, ...current].slice(0, 100)));
      } else {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.ok) throw new Error(data?.error || "Chưa gửi được góp ý. Vui lòng thử lại.");
      }
      setStatus("Em đã nhận được góp ý. Cảm ơn thầy cô rất nhiều ạ.");
      setMessage("");
      setContact("");
      setRating(4);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Chưa gửi được góp ý. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTool(detectedTool);
          setOpen(true);
          setStatus("");
          setError("");
        }}
        className="fixed bottom-4 right-4 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-[0_16px_40px_rgba(37,99,235,.18)] transition hover:border-blue-200 hover:bg-blue-50 sm:bottom-5 sm:right-5"
        aria-label="Góp ý cho Soạn Lab"
      >
        <MessageCircle size={17} />
        Góp ý
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/45 px-3 py-4 backdrop-blur-sm sm:px-4" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center">
            <form onSubmit={submit} className="w-full rounded-[28px] border border-blue-100 bg-white p-4 shadow-2xl sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <MessageCircle size={21} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="feedback-title" className="text-xl font-black text-slate-950">Góp ý cho Soạn Lab</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Thầy cô có thể gửi góp ý về giao diện, nội dung tạo ra, lỗi xuất file hoặc điểm còn khó dùng. Phản hồi của thầy cô sẽ giúp Soạn Lab hoàn thiện hơn.
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng góp ý">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Loại góp ý</span>
                  <select className="form-field mt-1" value={category} onChange={(event) => setCategory(event.target.value)}>
                    {FEEDBACK_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Công cụ đang dùng</span>
                  <select className="form-field mt-1" value={tool} onChange={(event) => setTool(event.target.value)}>
                    {Array.from(new Set([detectedTool, ...toolOptions])).map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4">
                <span className="label">Mức độ hài lòng</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {FEEDBACK_RATING_LABELS.map((label, index) => {
                    const value = index + 1;
                    const selected = rating === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`inline-flex min-h-10 items-center gap-1.5 rounded-2xl border px-3 text-xs font-black transition ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}
                        aria-pressed={selected}
                      >
                        <Star size={14} fill={selected ? "currentColor" : "none"} />
                        {value} - {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="label">Nội dung góp ý</span>
                <textarea
                  className="form-field mt-1 min-h-32 resize-y"
                  value={message}
                  maxLength={3000}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ví dụ: Khi xuất Word, ký hiệu toán bị lỗi; hoặc phần mục tiêu giáo án chưa sát chương trình."
                />
                <span className="mt-1 block text-right text-xs font-semibold text-slate-400">{message.length}/3000</span>
              </label>

              <label className="mt-3 block">
                <span className="label">Tên hoặc cách liên hệ, nếu thầy cô muốn em hỏi thêm</span>
                <input
                  className="form-field mt-1"
                  value={contact}
                  maxLength={300}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Ví dụ: Thầy Phú - Zalo"
                />
              </label>

              <p className="mt-3 text-xs leading-5 text-slate-500">Thông tin góp ý chỉ dùng để cải thiện bản thử nghiệm Soạn Lab.</p>
              {error ? <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
              {status ? <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{status}</p> : null}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary" disabled={sending}>{sending ? "Đang gửi…" : "Gửi góp ý"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
