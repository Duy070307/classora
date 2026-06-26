import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileText, MessageSquareText, PenTool, Send } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { sampleLinks } from "@/lib/sample-prefill";

const samples = [
  {
    title: "Toán 12 THPTQG",
    tool: "Tạo đề kiểm tra",
    output: "Đề ba phần, đáp án giáo viên, thang điểm, ma trận và bản đặc tả.",
    input: "Môn Toán, lớp 12, thời gian 90 phút, mã đề 0101, chủ đề hàm số, mũ - logarit, tích phân, xác suất và hình học không gian.",
    href: sampleLinks.math12Thptqg,
    Icon: PenTool
  },
  {
    title: "Lịch sử 12 THPTQG",
    tool: "Tạo đề kiểm tra",
    output: "Câu hỏi theo giai đoạn lịch sử, đúng/sai, đáp án và giải thích ngắn.",
    input: "Môn Lịch sử, lớp 12, thời gian 50 phút, chủ đề Việt Nam giai đoạn 1919-1975 và Đổi mới.",
    href: sampleLinks.history12Thptqg,
    Icon: BookOpenCheck
  },
  {
    title: "Phiếu học tập Toán 8",
    tool: "Tạo phiếu học tập",
    output: "Mục tiêu, kiến thức cần nhớ, bài tập từ cơ bản đến vận dụng và phần đáp án giáo viên.",
    input: "Môn Toán, lớp 8, chủ đề Phương trình bậc nhất một ẩn, có đáp án để giáo viên rà soát.",
    href: sampleLinks.worksheetMath8,
    Icon: FileText
  },
  {
    title: "Giáo án Ngữ văn 9",
    tool: "Tạo giáo án",
    output: "Kế hoạch bài dạy với hoạt động học, sản phẩm dự kiến và đánh giá.",
    input: "Môn Ngữ văn, lớp 9, bài Nghị luận xã hội, thời lượng 45 phút, phương pháp thảo luận nhóm và luyện tập cá nhân.",
    href: sampleLinks.lessonLiterature9,
    Icon: BookOpenCheck
  },
  {
    title: "Nhận xét học sinh",
    tool: "Tạo nhận xét học sinh",
    output: "Điểm mạnh, điểm cần cải thiện, hành động tiếp theo và nhận xét hoàn chỉnh.",
    input: "Học sinh mức khá, chăm chỉ, hoàn thành nhiệm vụ, cần trình bày bài rõ ràng hơn.",
    href: sampleLinks.studentComment,
    Icon: MessageSquareText
  },
  {
    title: "Tin nhắn phụ huynh",
    tool: "Tạo tin nhắn gửi phụ huynh",
    output: "Tin nhắn lịch sự, rõ ràng để thông báo lịch kiểm tra và nhắc học sinh ôn tập.",
    input: "Tình huống nhắc lịch kiểm tra, giọng văn trang trọng, nội dung ngắn gọn để phụ huynh dễ nắm.",
    href: sampleLinks.parentMessage,
    Icon: Send
  }
] as const;

export default function SamplesPage() {
  return <main className="warm-page min-h-screen">
    <Navbar />
    <section className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
      <div className="hero-gradient rounded-[30px] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,.2)] sm:p-9">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-200">Mẫu sử dụng</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl">Bắt đầu từ một ví dụ quen thuộc</h1>
        <p className="mt-4 max-w-3xl leading-7 text-blue-100">Chọn một mẫu, mở đúng công cụ và điền sẵn thông tin gợi ý. Nội dung tạo ra là bản nháp và cần giáo viên rà soát trước khi sử dụng.</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {samples.map(({ title, tool, output, input, href, Icon }) => <article key={title} className="play-card flex flex-col p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon size={21} /></span>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-blue-600">{tool}</p>
          <h2 className="mt-2 text-xl font-black text-slate-900">{title}</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p><strong className="text-slate-800">Công cụ sử dụng:</strong> {tool}</p>
            <p><strong className="text-slate-800">Nội dung mẫu:</strong> {input}</p>
            <p><strong className="text-slate-800">Kết quả dự kiến:</strong> {output}</p>
          </div>
          <Link href={href} className="btn-primary mt-6">
            Dùng mẫu này <ArrowRight size={16} />
          </Link>
        </article>)}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/getting-started" className="btn-secondary">Xem hướng dẫn</Link>
        <Link href="/dashboard" className="btn-secondary">Mở dashboard</Link>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
