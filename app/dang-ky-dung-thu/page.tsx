import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, LockKeyhole, UserCheck } from "lucide-react";
import { BetaRequestForm } from "@/components/BetaRequestForm";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Đăng ký dùng thử SOẠN LAB",
  description: "Gửi thông tin để được xem xét cấp tài khoản dùng thử SOẠN LAB dành cho giáo viên.",
};

export default function BetaRegistrationPage() {
  return (
    <main className="warm-page min-h-screen px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo href="/" size="md" />
          <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-700">Đăng nhập</Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
          <section className="rounded-[30px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white"><UserCheck size={23} /></span>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-300">Bản thử nghiệm giới hạn</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Đăng ký dùng thử SOẠN LAB</h1>
            <p className="mt-4 leading-7 text-slate-300">
              SOẠN LAB đang mở bản thử nghiệm giới hạn cho giáo viên. Thầy/cô có thể gửi thông tin để được cấp tài khoản dùng thử.
            </p>
            <div className="mt-7 space-y-3 text-sm leading-6 text-slate-200">
              <Info icon={ClipboardCheck} text="Thông tin giúp SOẠN LAB ưu tiên nhu cầu phù hợp với giáo viên." />
              <Info icon={UserCheck} text="Mỗi yêu cầu sẽ được quản trị viên xem xét trước khi cấp tài khoản." />
              <Info icon={LockKeyhole} text="Đăng ký này không tự động tạo tài khoản và không mở đăng ký tự do." />
            </div>
          </section>

          <section className="rounded-[30px] border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 border-b border-slate-100 pb-5">
              <h2 className="text-2xl font-black text-slate-950">Thông tin giáo viên</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Các trường có dấu <span className="font-black text-blue-600">*</span> là bắt buộc.</p>
            </div>
            <BetaRequestForm />
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ icon: Icon, text }: { icon: typeof ClipboardCheck; text: string }) {
  return <div className="flex gap-3 rounded-2xl bg-white/5 p-3"><Icon className="mt-0.5 shrink-0 text-blue-300" size={18} /><p>{text}</p></div>;
}
