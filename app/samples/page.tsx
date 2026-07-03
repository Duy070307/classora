import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  FileText,
  MessageSquareText,
  PenTool,
  Send,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { sampleLinks } from "@/lib/sample-prefill";

const filters = ["Đề kiểm tra", "Phiếu học tập", "Giáo án", "Nhận xét", "Tin nhắn"] as const;

const samples = [
  {
    title: "Toán 12 THPTQG",
    subject: "Toán · Lớp 12",
    category: "Đề kiểm tra",
    tool: "Tạo đề kiểm tra",
    output: "Đề ba phần, đáp án giáo viên, thang điểm, ma trận và bản đặc tả.",
    time: "3-5 phút",
    href: sampleLinks.math12Thptqg,
    Icon: PenTool,
  },
  {
    title: "Lịch sử 12 THPTQG",
    subject: "Lịch sử · Lớp 12",
    category: "Đề kiểm tra",
    tool: "Tạo đề kiểm tra",
    output: "Câu hỏi theo giai đoạn lịch sử, đúng/sai, đáp án và giải thích ngắn.",
    time: "3-5 phút",
    href: sampleLinks.history12Thptqg,
    Icon: BookOpenCheck,
  },
  {
    title: "Phiếu học tập Toán 8",
    subject: "Toán · Lớp 8",
    category: "Phiếu học tập",
    tool: "Tạo phiếu học tập",
    output: "Mục tiêu, kiến thức cần nhớ, bài tập từ cơ bản đến vận dụng và phần đáp án giáo viên.",
    time: "2-4 phút",
    href: sampleLinks.worksheetMath8,
    Icon: FileText,
  },
  {
    title: "Giáo án Ngữ văn 9",
    subject: "Ngữ văn · Lớp 9",
    category: "Giáo án",
    tool: "Tạo giáo án",
    output: "Kế hoạch bài dạy với hoạt động học, sản phẩm dự kiến và đánh giá.",
    time: "4-6 phút",
    href: sampleLinks.lessonLiterature9,
    Icon: BookOpenCheck,
  },
  {
    title: "Nhận xét học sinh",
    subject: "Chủ nhiệm · Cá nhân",
    category: "Nhận xét",
    tool: "Tạo nhận xét học sinh",
    output: "Điểm mạnh, điểm cần cải thiện, hành động tiếp theo và nhận xét hoàn chỉnh.",
    time: "1-2 phút",
    href: sampleLinks.studentComment,
    Icon: MessageSquareText,
  },
  {
    title: "Tin nhắn phụ huynh",
    subject: "Chủ nhiệm · Phụ huynh",
    category: "Tin nhắn",
    tool: "Tạo tin nhắn gửi phụ huynh",
    output: "Tin nhắn lịch sự, rõ ràng để thông báo lịch kiểm tra và nhắc học sinh ôn tập.",
    time: "1-2 phút",
    href: sampleLinks.parentMessage,
    Icon: Send,
  },
] as const;


export const metadata: Metadata = {
  title: { absolute: "Mẫu sử dụng - Soạn Lab" },
  description: "Bắt đầu nhanh với các mẫu tạo đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và tin nhắn phụ huynh.",
};
export default function SamplesPage() {
  return (
    <main className="warm-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="hero-gradient rounded-[30px] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,.2)] sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-200">Mẫu sử dụng</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Bắt đầu từ một ví dụ quen thuộc</h1>
          <p className="mt-4 max-w-3xl leading-7 text-blue-100">
            Chọn một mẫu, mở đúng công cụ và điền sẵn thông tin gợi ý. Nội dung tạo ra là bản nháp và cần giáo viên rà soát trước khi sử dụng.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <span key={filter} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-white">
                {filter}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {samples.map(({ title, subject, category, tool, output, time, href, Icon }) => (
            <article key={title} className="play-card flex flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon size={21} />
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{category}</span>
              </div>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-blue-600">{subject}</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">{title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p><strong className="text-slate-800">Công cụ:</strong> {tool}</p>
                <p><strong className="text-slate-800">Kết quả dự kiến:</strong> {output}</p>
                <p><strong className="text-slate-800">Thời gian ước tính:</strong> {time}</p>
              </div>
              <Link href={href} className="btn-primary mt-6">
                Dùng mẫu này <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/getting-started" className="btn-secondary">Xem hướng dẫn</Link>
          <Link href="/dashboard" className="btn-secondary">Bắt đầu sử dụng</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
