import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  FileText,
  History,
  MessageSquareText,
  PenTool,
  Sigma,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const capabilities = [
  ["Soạn đề kiểm tra", "Tạo đề, đáp án, thang điểm và ma trận để giáo viên rà soát.", PenTool],
  ["Tạo phiếu học tập", "Chuẩn bị bài tập, phần vận dụng và hướng dẫn giáo viên.", FileText],
  ["Lập kế hoạch bài dạy", "Gợi ý mục tiêu, hoạt động học và cách đánh giá.", BookOpenCheck],
  ["Viết nhận xét học sinh", "Soạn nhận xét tự nhiên, tích cực và dễ chỉnh sửa.", MessageSquareText],
  ["Quản lý tài liệu", "Lưu lịch sử, mở lại và xuất file khi cần dùng lại.", History],
  ["Ảnh công thức → LaTeX", "Chuyển ảnh công thức hoặc hình học đã cắt gọn thành mã LaTeX/TikZ.", Sigma],
] as const;

const steps = [
  ["Chọn công cụ", "Chọn đúng công cụ theo công việc cần làm."],
  ["Nhập thông tin", "Điền môn, lớp, chủ đề và yêu cầu cụ thể."],
  ["Tạo bản nháp", "Soạn Lab tạo bản nháp để thầy cô chỉnh sửa."],
  ["Xuất hoặc lưu", "Xuất Word/PDF hoặc lưu lịch sử để dùng lại."],
] as const;

const benefits = [
  [
    "Giảm thời gian lặp lại",
    "Tạo bản nháp cho những công việc quen thuộc như đề kiểm tra, phiếu học tập, nhận xét và tin nhắn phụ huynh.",
  ],
  [
    "Xuất file dễ chỉnh sửa",
    "Tài liệu có thể xuất Word/PDF để thầy cô kiểm tra, chỉnh sửa và sử dụng theo nhu cầu.",
  ],
  [
    "Có bước rà soát rõ ràng",
    "Nội dung được xem là bản nháp hỗ trợ. Giáo viên luôn cần kiểm tra lại chuyên môn, đáp án và định dạng.",
  ],
] as const;

export const metadata: Metadata = {
  title: { absolute: "Soạn Lab - Bộ công cụ hỗ trợ giáo viên Việt Nam" },
  description: "Soạn Lab hỗ trợ giáo viên soạn đề kiểm tra, tạo phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF nhanh hơn.",
};

export default function HomePage() {
  return (
    <main className="warm-page min-h-screen">
      <Navbar />

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1fr_0.88fr] lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-blue-700">Bộ công cụ hỗ trợ giáo viên Việt Nam</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.03em] text-slate-950 sm:text-5xl lg:text-6xl">
            Soạn tài liệu dạy học <span className="text-blue-600">nhanh hơn</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Tạo đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và xuất Word/PDF trong một không gian gọn gàng.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/dashboard" className="btn-primary min-h-12 px-5">
              Bắt đầu sử dụng
              <ArrowRight size={18} />
            </Link>
            <Link href="/tools" className="btn-secondary min-h-12 px-5">
              Xem công cụ
            </Link>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Nội dung là bản nháp hỗ trợ giáo viên và cần được rà soát trước khi sử dụng.
          </p>
        </div>
        <HeroPreview />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-blue-700">Công cụ nổi bật</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Giáo viên có thể làm gì với Soạn Lab?
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            Chọn công cụ, nhập thông tin cần thiết và xuất tài liệu để chỉnh sửa hoặc in ấn.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([title, text, Icon]) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={19} />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-blue-700">Cách hoạt động</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Từ ý tưởng đến tài liệu có thể chỉnh sửa
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, text], index) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-extrabold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-4 lg:grid-cols-3">
          {benefits.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-20">
        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold text-blue-700">Lưu ý khi sử dụng</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                Soạn Lab hỗ trợ tạo bản nháp, không thay thế giáo viên.
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                Trước khi dùng chính thức, thầy cô cần kiểm tra lại chuyên môn, đáp án, thang điểm, cách diễn đạt và định dạng tài liệu.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/dashboard" className="btn-primary">
                Bắt đầu sử dụng
              </Link>
              <Link href="/tools" className="btn-secondary">
                Xem công cụ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function HeroPreview() {
  const rows = [
    ["Soạn đề kiểm tra", "Đáp án · Ma trận · Thang điểm", ClipboardList],
    ["Phiếu học tập", "Bài tập · Hướng dẫn · In ấn", FileText],
    ["Nhận xét học sinh", "Tự nhiên · Tích cực · Dễ chỉnh", MessageSquareText],
    ["Xuất Word/PDF", "Tải xuống hoặc in nhanh", History],
  ] as const;

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-700">Soạn Lab Workspace</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Tài liệu giảng dạy</h2>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          Bản nháp
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map(([title, text, Icon]) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-slate-200">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-900">{title}</p>
              <p className="text-xs leading-5 text-slate-500">{text}</p>
            </div>
            <Check className="shrink-0 text-blue-600" size={18} />
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/create" className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-blue-700">
          Tạo tài liệu
        </Link>
        <Link href="/tools" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-extrabold text-slate-800 transition hover:border-blue-200 hover:text-blue-700">
          Xem công cụ
        </Link>
      </div>
    </div>
  );
}
