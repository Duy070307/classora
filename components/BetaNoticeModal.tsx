"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";

const storageKey = "soanlab-beta-notice-accepted";

const bullets = [
  "Đây là bản thử nghiệm.",
  "Nội dung có thể chưa chính xác hoàn toàn.",
  "Giáo viên cần rà soát trước khi sử dụng.",
  "Phản hồi của thầy cô sẽ giúp Soạn Lab hoàn thiện hơn.",
] as const;

export function BetaNoticeModal() {
  const [visible, setVisible] = useState(false);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (window.localStorage.getItem(storageKey) !== "true") {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primaryButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") accept();
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>("[data-beta-notice] button"),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);

  function accept() {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {
      // Nếu trình duyệt chặn localStorage, modal vẫn có thể đóng trong phiên hiện tại.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      data-beta-notice
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
      aria-describedby="beta-notice-description"
    >
      <div className="ui-dialog max-h-[92vh] max-w-2xl overflow-y-auto">
        <div className="flex items-start gap-4">
          <BrandLockup variant="iconOnly" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">SOẠN LAB</p>
            <h2 id="beta-notice-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Thông báo về bản thử nghiệm
            </h2>
          </div>
        </div>

        <div id="beta-notice-description" className="mt-5 space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
          <p>
            Soạn Lab hiện đang trong giai đoạn thử nghiệm để giáo viên trải nghiệm cách hoạt động của sản phẩm.
          </p>
          <p>
            Các nội dung được tạo tự động chỉ là bản nháp hỗ trợ soạn tài liệu. Kết quả có thể còn sai sót về chuyên môn, đáp án, định dạng hoặc cách diễn đạt.
          </p>
          <p>
            Ở bản chính thức, hệ thống sẽ tiếp tục được cải thiện để cho kết quả chính xác và ổn định hơn. Thầy cô vui lòng kiểm tra, chỉnh sửa và rà soát lại trước khi sử dụng trong giảng dạy.
          </p>
        </div>

        <ul className="mt-5 grid gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm font-medium leading-6 text-slate-800 sm:grid-cols-2">
          {bullets.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={17} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <button ref={primaryButtonRef} type="button" className="btn-primary" onClick={accept}>
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
