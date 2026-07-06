import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileText, MessageSquareText, PenTool, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { sampleLinks } from "@/lib/sample-prefill";

const samples = [
  {
    title: "Toán 12 THPTQG",
    subject: "Toán · Lớp 12",
    group: "Mẫu phổ biến",
    work: "Đề kiểm tra",
    creates: "Đề ba phần, đáp án giáo viên, thang điểm, ma trận và bản đặc tả.",
    preview: "PHẦN I trắc nghiệm · PHẦN II đúng/sai · PHẦN III trả lời ngắn",
    href: sampleLinks.math12Thptqg,
    Icon: PenTool,
  },
  {
    title: "Lịch sử 12 THPTQG",
    subject: "Lịch sử · Lớp 12",
    group: "Theo môn học",
    work: "Đề kiểm tra",
    creates: "Câu hỏi theo giai đoạn lịch sử, có đáp án và giải thích ngắn.",
    preview: "Chủ đề: Việt Nam sau 1945 · Có đáp án giáo viên",
    href: sampleLinks.history12Thptqg,
    Icon: BookOpenCheck,
  },
  {
    title: "Phiếu học tập Toán 8",
    subject: "Toán · Lớp 8",
    group: "Theo môn học",
    work: "Phiếu học tập",
    creates: "Mục tiêu, kiến thức cần nhớ, bài tập cơ bản đến vận dụng và đáp án.",
    preview: "Phù hợp hoạt động cá nhân hoặc nhóm nhỏ",
    href: sampleLinks.worksheetMath8,
    Icon: FileText,
  },
  {
    title: "Giáo án Ngữ văn 9",
    subject: "Ngữ văn · Lớp 9",
    group: "Theo công việc giáo viên",
    work: "Giáo án",
    creates: "Kế hoạch bài dạy với hoạt động học, sản phẩm dự kiến và đánh giá.",
    preview: "Có mục tiêu, chuẩn bị, tiến trình và đánh giá",
    href: sampleLinks.lessonLiterature9,
    Icon: BookOpenCheck,
  },
  {
    title: "Nhận xét học sinh",
    subject: "Chủ nhiệm · Cá nhân",
    group: "Theo công việc giáo viên",
    work: "Nhận xét",
    creates: "Điểm mạnh, điểm cần cải thiện, hành động tiếp theo và nhận xét hoàn chỉnh.",
    preview: "Giọng văn tự nhiên, dễ chỉnh sửa",
    href: sampleLinks.studentComment,
    Icon: MessageSquareText,
  },
  {
    title: "Tin nhắn phụ huynh",
    subject: "Chủ nhiệm · Phụ huynh",
    group: "Theo công việc giáo viên",
    work: "Tin nhắn",
    creates: "Tin nhắn lịch sự, rõ ràng để thông báo hoặc nhắc học sinh ôn tập.",
    preview: "Có bản ngắn và bản đầy đủ",
    href: sampleLinks.parentMessage,
    Icon: Send,
  },
] as const;

const sections = ["Mẫu phổ biến", "Theo môn học", "Theo công việc giáo viên"] as const;

export const metadata: Metadata = {
  title: { absolute: "Mẫu sử dụng - Soạn Lab" },
  description: "Bắt đầu nhanh với các mẫu tạo đề kiểm tra, phiếu học tập, giáo án, nhận xét học sinh và tin nhắn phụ huynh.",
};

export default function SamplesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
        <div className="rounded-[32px] bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 p-6 text-white shadow-[0_24px_60px_rgba(37,99,235,.22)] sm:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-cyan-200">Mẫu sử dụng</p>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Bắt đầu từ một ví dụ quen thuộc</h1>
          <p className="mt-4 max-w-3xl leading-7 text-blue-100">
            Chọn một mẫu, mở đúng công cụ và điền sẵn thông tin gợi ý. Nội dung tạo ra là bản nháp và cần giáo viên rà soát trước khi sử dụng.
          </p>
        </div>

        {sections.map((section) => {
          const items = samples.filter((sample) => sample.group === section || (section === "Mẫu phổ biến" && sample.title.includes("THPTQG")));
          return (
            <section key={section} className="mt-9">
              <h2 className="text-2xl font-black text-slate-950">{section}</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map(({ title, subject, work, creates, preview, href, Icon }) => (
                  <article key={`${section}-${title}`} className="flex flex-col rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/60">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Icon size={21} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">{work}</span>
                    </div>
                    <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-blue-600">{subject}</p>
                    <h3 className="mt-2 text-xl font-black text-slate-900">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{creates}</p>
                    <div className="mt-4 rounded-2xl bg-blue-50/70 p-3 text-xs font-semibold leading-5 text-slate-600">{preview}</div>
                    <Link href={href} className="btn-primary mt-6">
                      Dùng mẫu này <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/getting-started" className="btn-secondary">Xem hướng dẫn</Link>
          <Link href="/dashboard" className="btn-secondary">Bắt đầu sử dụng</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
