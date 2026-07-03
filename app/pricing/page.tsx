import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const plans = [
  {
    name: "Cá nhân",
    description: "Phù hợp giáo viên muốn chuẩn bị tài liệu hằng ngày nhanh hơn.",
    features: ["Tạo đề kiểm tra và tài liệu dạy học", "Xuất Word/PDF", "Lưu lịch sử trên trình duyệt", "Dùng mẫu sử dụng và mẫu cá nhân"],
  },
  {
    name: "Tổ chuyên môn",
    description: "Phù hợp nhóm giáo viên muốn thống nhất quy trình và mẫu tài liệu.",
    features: ["Gợi ý quy trình chung", "Chuẩn hóa đầu ra tài liệu", "Phù hợp tổ bộ môn", "Định hướng chia sẻ mẫu trong tương lai"],
  },
  {
    name: "Trường học",
    description: "Dành cho đơn vị muốn triển khai rộng và tùy chỉnh theo nhu cầu.",
    features: ["Triển khai theo đơn vị", "Tùy chỉnh theo nhu cầu", "Định hướng quản trị tập trung", "Phù hợp dùng ở quy mô trường"],
  },
] as const;


export const metadata: Metadata = {
  title: { absolute: "Bảng giá - Soạn Lab" },
  description: "Xem định hướng các gói sử dụng Soạn Lab cho giáo viên cá nhân, tổ chuyên môn và trường học.",
};
export default function PricingPage() {
  return (
    <main className="warm-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="hero-gradient rounded-[30px] p-6 text-white shadow-xl shadow-blue-200 sm:p-9">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">Bảng giá</span>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-5xl">Các gói sử dụng Soạn Lab</h1>
          <p className="mt-4 max-w-3xl leading-7 text-blue-100">
            Soạn Lab tập trung vào các công cụ hỗ trợ giáo viên tạo bản nháp, rà soát và xuất Word/PDF. Các gói sử dụng sẽ được mở khi hệ thống tài khoản và thanh toán hoàn thiện.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2 text-sm font-bold text-indigo-700 shadow-lg">
              Bắt đầu sử dụng
            </Link>
            <Link href="/samples" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold text-white">
              Xem mẫu sử dụng <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="play-card flex flex-col p-6">
              <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
              <p className="mt-3 leading-7 text-slate-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={17} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-7 text-xs font-bold uppercase tracking-wide text-blue-700">Chưa mở thanh toán</p>
            </article>
          ))}
        </div>

        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium leading-6 text-amber-800">
          Các gói sử dụng sẽ được mở khi hệ thống tài khoản và thanh toán hoàn thiện. Hiện tại Soạn Lab không có giao dịch, không có checkout và không yêu cầu thanh toán trong ứng dụng.
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
