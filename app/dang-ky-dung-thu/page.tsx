import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, MailCheck, UserCheck } from "lucide-react";
import { BetaRequestForm } from "@/components/BetaRequestForm";
import { BrandLockup } from "@/components/BrandLockup";

export const metadata: Metadata = {
  title: "Đăng ký dùng thử SOẠN LAB",
  description: "Gửi thông tin đăng ký trải nghiệm SOẠN LAB dành cho giáo viên.",
};

export default function BetaRegistrationPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto min-h-screen max-w-7xl border-x border-slate-200 bg-white">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 sm:px-8">
          <BrandLockup href="/" priority />
          <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-slate-600 hover:text-blue-700 hover:underline">Đăng nhập</Link>
        </header>

        <div className="grid lg:grid-cols-[.74fr_1.26fr]">
          <section className="order-2 border-t border-blue-200 bg-blue-50/70 p-6 text-slate-950 sm:p-9 lg:order-1 lg:border-r lg:border-t-0 lg:p-10" data-testid="trial-information-panel">
            <div>
              <span className="inline-flex size-11 items-center justify-center border border-blue-200 bg-white text-blue-700"><UserCheck size={22} /></span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Trải nghiệm dành cho giáo viên</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Đăng ký dùng thử SOẠN LAB</h1>
              <p className="mt-5 leading-7 text-slate-600">
                Gửi thông tin để đăng ký trải nghiệm các công cụ soạn và rà soát tài liệu dành cho giáo viên.
              </p>
              <div className="mt-8 border-t border-blue-200 pt-5">
                <Info icon={ClipboardCheck} text="Điền thông tin và nhu cầu sử dụng của thầy/cô." />
                <Info icon={UserCheck} text="Sau khi gửi, thầy/cô vui lòng chờ quản trị viên duyệt." />
                <Info icon={MailCheck} text="Thông tin tài khoản sẽ được gửi khi yêu cầu được chấp nhận." />
              </div>
            </div>
          </section>

          <section className="order-1 min-w-0 p-5 sm:p-8 lg:order-2 lg:p-10">
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
  return <div className="flex gap-3 border-b border-blue-200/80 py-4 last:border-b-0"><Icon className="mt-0.5 shrink-0 text-blue-700" size={18} /><p className="text-sm leading-6 text-slate-600">{text}</p></div>;
}
