import type { Metadata } from "next";
import Link from "next/link";
import { Check, ClipboardCheck, LockKeyhole, UserCheck } from "lucide-react";
import { BetaRequestForm } from "@/components/BetaRequestForm";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Đăng ký dùng thử SOẠN LAB",
  description: "Gửi thông tin để được xem xét cấp tài khoản dùng thử SOẠN LAB dành cho giáo viên.",
};

export default function BetaRegistrationPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl overflow-hidden border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,.08)]">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-8">
          <BrandLogo href="/" size="sm" />
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 hover:text-blue-700 hover:underline">Đăng nhập</Link>
        </header>

        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <section className="relative overflow-hidden bg-slate-950 p-6 text-white sm:p-9 lg:p-10">
            <div className="pointer-events-none absolute inset-0 soft-grid-bg opacity-[.08]" aria-hidden="true" />
            <div className="relative">
              <span className="inline-flex size-11 items-center justify-center border border-blue-400/30 bg-blue-500/10 text-blue-300"><UserCheck size={22} /></span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Thử nghiệm giới hạn</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Đăng ký dùng thử SOẠN LAB</h1>
              <p className="mt-5 leading-7 text-slate-300">
                Gửi thông tin để nhóm phát triển xem xét nhu cầu và cấp quyền truy cập phù hợp cho giáo viên.
              </p>
              <div className="mt-8 border-t border-white/15 pt-5">
                <Info icon={ClipboardCheck} text="Thông tin giúp SOẠN LAB hiểu công việc thầy/cô cần hỗ trợ." />
                <Info icon={UserCheck} text="Mỗi yêu cầu được quản trị viên xem xét thủ công trước khi cấp tài khoản." />
                <Info icon={LockKeyhole} text="Gửi yêu cầu không đồng nghĩa với việc tài khoản được tạo ngay lập tức." />
              </div>
              <p className="mt-8 flex gap-3 border-l-2 border-blue-400 pl-4 text-sm leading-6 text-slate-300">
                <Check className="mt-0.5 shrink-0 text-blue-300" size={17} />
                Thầy/cô sẽ nhận thông tin tiếp theo sau khi yêu cầu được xem xét.
              </p>
            </div>
          </section>

          <section className="min-w-0 p-5 sm:p-8 lg:p-10">
            <div className="mb-7 border-b border-slate-200 pb-5">
              <h2 className="text-2xl font-bold text-slate-950">Thông tin giáo viên</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Các trường có dấu <span className="font-bold text-blue-700">*</span> là bắt buộc.</p>
            </div>
            <BetaRequestForm />
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ icon: Icon, text }: { icon: typeof ClipboardCheck; text: string }) {
  return <div className="flex gap-3 border-b border-white/10 py-4 last:border-b-0"><Icon className="mt-0.5 shrink-0 text-blue-300" size={18} /><p className="text-sm leading-6 text-slate-200">{text}</p></div>;
}
