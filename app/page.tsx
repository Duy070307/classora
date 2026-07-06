import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  MessageSquareText,
  PenTool,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandLogo } from "@/components/BrandLogo";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { sampleLinks } from "@/lib/sample-prefill";

const capabilities = [
  ["Soạn đề kiểm tra", "Tạo đề, đáp án, thang điểm, ma trận", PenTool],
  ["Tạo phiếu học tập", "Bài tập cơ bản, vận dụng, hướng dẫn giáo viên", FileText],
  ["Lập kế hoạch bài dạy", "Mục tiêu, hoạt động, đánh giá", BookOpenCheck],
  ["Viết nhận xét học sinh", "Nhận xét tự nhiên, tích cực, dễ chỉnh sửa", MessageSquareText],
  ["Quản lý tài liệu", "Lưu lịch sử, xuất lại khi cần", History],
  ["Dùng mẫu nhanh", "Bắt đầu từ các mẫu có sẵn", ClipboardList],
] as const;

const steps = [
  ["Chọn công cụ", "Chọn đúng luồng cho đề kiểm tra, phiếu học tập, giáo án hoặc nhận xét.", LayoutDashboard],
  ["Nhập thông tin bài học", "Điền môn, lớp, chủ đề và yêu cầu cụ thể bằng biểu mẫu rõ ràng.", ClipboardList],
  ["Tạo bản nháp", "Soạn Lab tạo nội dung ban đầu để giáo viên đọc, chỉnh và hoàn thiện.", Sparkles],
  ["Xuất hoặc lưu", "Xuất Word/PDF khi cần in ấn, hoặc lưu lịch sử để mở lại sau.", FileText],
] as const;

const samples = [
  ["Toán 12 THPTQG", "Đề kiểm tra có cấu trúc THPTQG", sampleLinks.math12Thptqg, PenTool],
  ["Lịch sử 12 THPTQG", "Đề ôn tập kèm đáp án giáo viên", sampleLinks.history12Thptqg, BookOpenCheck],
  ["Phiếu học tập Toán 8", "Phiếu bài tập có phần hướng dẫn", sampleLinks.worksheetMath8, FileText],
] as const;


export const metadata: Metadata = {
  title: { absolute: "Soạn Lab - Bộ công cụ hỗ trợ giáo viên Việt Nam" },
  description: "Soạn Lab hỗ trợ giáo viên soạn đề kiểm tra, tạo phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF nhanh hơn.",
};
export default function HomePage() {
  return (
    <main className="warm-page">
      <Navbar />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1.02fr_.98fr] lg:py-18">
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
            Dành cho giáo viên Việt Nam · Xuất Word/PDF · Có mẫu sử dụng nhanh
          </span>
          <div className="mt-6">
            <BrandLogo variant="full" />
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.03] tracking-[-.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            Soạn tài liệu dạy học
            <br />
            <span className="text-blue-600">nhanh hơn</span> với Soạn Lab
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            Tạo đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF trong một không gian duy nhất.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/create" className="btn-primary min-h-13 px-6">
              Dùng thử Soạn Lab
              <ArrowRight size={18} />
            </Link>
            <Link href="/samples" className="btn-secondary min-h-13 px-6">
              Xem mẫu sử dụng
            </Link>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Tạo bản nháp · Cần giáo viên rà soát · Lưu trên trình duyệt
          </p>
        </div>
        <HeroMockup />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-18">
        <div className="max-w-3xl">
          <span className="soft-badge">Công cụ cho công việc hằng ngày</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Giáo viên có thể làm gì với Soạn Lab?
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Bắt đầu từ biểu mẫu rõ ràng, tạo bản nháp nhanh, rồi xuất tài liệu để chỉnh sửa hoặc in ấn.
          </p>
        </div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([title, text, Icon]) => (
            <article key={title} className="play-card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon size={21} />
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-blue-50/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <span className="soft-badge">Quy trình rõ ràng</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Cách hoạt động
            </h2>
            <p className="mt-3 text-slate-600">
              Bốn bước ngắn để có bản nháp tài liệu đầu tiên.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text, Icon], index) => (
              <article key={title} className="play-card p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-blue-600">0{index + 1}</span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Icon size={19} />
                  </span>
                </div>
                <h3 className="mt-5 font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <span className="soft-badge">Mẫu sử dụng</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Bắt đầu nhanh bằng mẫu có sẵn
            </h2>
            <p className="mt-3 leading-7 text-slate-600">
              Chọn một mẫu quen thuộc, mở công cụ đã điền sẵn thông tin gợi ý, rồi chỉnh lại theo lớp của thầy/cô.
            </p>
            <Link href="/samples" className="btn-primary mt-6">
              Xem tất cả mẫu sử dụng
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {samples.map(([title, text, href, Icon]) => (
              <Link key={title} href={href} className="play-card group p-5 transition hover:-translate-y-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 font-extrabold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">
                  Dùng mẫu này <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-blue-100 bg-white/70 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <div className="play-card p-7 sm:p-9">
            <span className="soft-badge">Đầu ra dễ sử dụng</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              Tạo bản nháp nhanh, luôn có bước rà soát.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Nội dung được tạo tự động để hỗ trợ giáo viên. Trước khi dùng chính thức,
              giáo viên cần kiểm tra chuyên môn, đáp án và cách diễn đạt.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Tạo bản nháp", "Xuất Word/PDF", "Lưu lịch sử", "Dễ rà soát"].map((item) => (
                <SoanLabBadge key={item} tone={item.includes("Word") ? "export" : "useful"}>
                  {item}
                </SoanLabBadge>
              ))}
            </div>
          </div>
          <div className="play-card p-7 sm:p-9">
            <span className="soft-badge">Tập trung cho giáo viên</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              Giảm thời gian cho các việc lặp lại.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Soạn Lab gom các bước chuẩn bị tài liệu vào một luồng rõ ràng: chọn công cụ,
              nhập thông tin, tạo bản nháp, xuất Word/PDF hoặc lưu lịch sử.
            </p>
            <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
              Mục tiêu không phải thay thế giáo viên, mà giúp giáo viên có thêm thời gian cho học sinh và chất lượng bài dạy.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="play-card relative overflow-hidden p-8 sm:p-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-100" />
          <div className="relative max-w-3xl">
            <BrandLogo variant="mark" />
            <h2 className="mt-6 text-3xl font-black text-slate-950 sm:text-4xl">
              Sẵn sàng tạo tài liệu đầu tiên với Soạn Lab?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Mở dashboard, chọn một mẫu nhanh hoặc bắt đầu từ công cụ quen thuộc để tạo bản nháp và xuất Word/PDF.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/create" className="btn-primary">Dùng thử Soạn Lab</Link>
              <Link href="/samples" className="btn-secondary">Xem mẫu sử dụng</Link>
              <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function HeroMockup() {
  const rows = [
    ["Tạo đề kiểm tra", "Đáp án · Ma trận · Thang điểm", PenTool],
    ["Phiếu học tập", "Mục tiêu · Bài tập · Hướng dẫn", FileText],
    ["Xuất Word/PDF", "Tải xuống hoặc in nhanh", ShieldCheck],
    ["Lưu lịch sử", "Mở lại tài liệu đã tạo", History],
    ["Mẫu sử dụng", "Bắt đầu từ ví dụ có sẵn", ClipboardList],
  ] as const;

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-cyan-200/50 to-indigo-200/50 blur-2xl" />
      <div className="play-card relative overflow-hidden p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-blue-600">Soạn Lab workspace</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Tài liệu giảng dạy</h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">Sẵn sàng</span>
        </div>
        <div className="mt-5 space-y-3">
          {rows.map(([title, text, Icon]) => (
            <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-900">{title}</p>
                <p className="text-xs leading-5 text-slate-500">{text}</p>
              </div>
              <Check className="shrink-0 text-emerald-500" size={18} />
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link href="/tools/exam-generator" className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-extrabold text-white">
            Tạo đề
          </Link>
          <Link href="/samples" className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-extrabold text-slate-800">
            Xem mẫu
          </Link>
        </div>
      </div>
    </div>
  );
}
