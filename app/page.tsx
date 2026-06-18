import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileText, FolderClock, Library, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ToolCard } from "@/components/ToolCard";
import { toolRegistry } from "@/lib/tool-registry";
import { SiteFooter } from "@/components/SiteFooter";

const painPoints = ["Soạn đề", "Làm đáp án và thang điểm", "Tạo ma trận đề", "Viết nhận xét học sinh", "Chuẩn bị phiếu học tập", "Chỉnh file Word"];
const benefits = [
  ["Form dễ dùng", "Không cần viết prompt dài hay học cách dùng AI.", Sparkles],
  ["Đúng ngữ cảnh", "Nội dung và biểu mẫu hướng đến giáo viên Việt Nam.", CheckCircle2],
  ["Lưu lịch sử", "Tìm lại tài liệu đã tạo ngay trên trình duyệt.", FolderClock],
  ["Xuất Word", "Tải bản nháp .docx để kiểm tra và chỉnh sửa.", FileText],
  ["Mẫu cá nhân", "Dùng lại cấu trúc tài liệu quen thuộc của giáo viên.", Clock3],
  ["Ngân hàng câu hỏi", "Lưu và tái sử dụng câu hỏi theo môn, lớp, chủ đề.", Library]
];
const coreHrefs = ["/tools/exam-generator", "/tools/matrix-generator", "/tools/exam-shuffler", "/tools/bulk-student-comments", "/tools/lesson-plan-generator", "/question-bank"];

export default function HomePage() {
  const coreTools = toolRegistry.filter((tool) => coreHrefs.includes(tool.href));
  return <main>
    <Navbar />
    <section className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">Classora · MVP cho giáo viên</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-normal text-ink md:text-6xl">Bộ công cụ AI cho giáo viên Việt Nam</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted md:text-xl">Classora giúp giáo viên soạn đề, tạo phiếu học tập, viết nhận xét học sinh, tạo ma trận đề và xuất Word nhanh hơn.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/tools" className="btn-primary">Khám phá công cụ<ArrowRight size={16} /></Link><Link href="/dashboard" className="btn-secondary">Dùng thử demo</Link></div>
        <p className="mt-6 max-w-2xl rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Bản hiện tại là MVP/demo dùng AI mô phỏng để kiểm thử quy trình.</p>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="text-sm font-bold uppercase tracking-wide text-brand">Vấn đề thực tế</p><h2 className="mt-2 text-3xl font-bold text-ink">Giáo viên mất quá nhiều thời gian cho việc lặp lại</h2><p className="mt-4 leading-7 text-muted">Những việc nhỏ nhưng xuất hiện liên tục dễ chiếm mất thời gian dành cho bài giảng và học sinh.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{painPoints.map((item) => <div key={item} className="card flex items-center gap-3 p-4"><CheckCircle2 size={18} className="text-brand" /><span className="font-semibold text-ink">{item}</span></div>)}</div>
      </div>
    </section>

    <section className="border-y border-line bg-white"><div className="mx-auto max-w-6xl px-4 py-16"><p className="text-sm font-bold uppercase tracking-wide text-brand">Giải pháp</p><h2 className="mt-2 text-3xl font-bold text-ink">Classora gom các công cụ đó vào một nơi</h2><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{benefits.map(([title, text, Icon]) => { const BenefitIcon = Icon as typeof Sparkles; return <article key={title as string} className="border-t-2 border-brand pt-4"><BenefitIcon size={22} className="text-brand" /><h3 className="mt-3 font-bold text-ink">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted">{text as string}</p></article>; })}</div></div></section>

    <section className="mx-auto max-w-6xl px-4 py-16"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-brand">Workflow cốt lõi</p><h2 className="mt-2 text-3xl font-bold text-ink">Công cụ nên thử đầu tiên</h2></div><Link href="/tools" className="hidden text-sm font-semibold text-brand sm:block">Xem tất cả công cụ</Link></div><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{coreTools.map((tool) => <ToolCard key={tool.href} {...tool} categoryLabel="Công cụ Classora" />)}</div></section>

    <section className="border-y border-line bg-white"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[0.75fr_1.25fr]"><div><p className="text-sm font-bold uppercase tracking-wide text-brand">Founder</p><h2 className="mt-2 text-3xl font-bold text-ink">Về người tạo ra Classora</h2><p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">Classora hiện đang ở giai đoạn MVP/demo và sẽ tiếp tục được cải thiện dựa trên góp ý thực tế từ giáo viên.</p></div><div className="space-y-4 leading-7 text-slate-700"><p>Classora được tạo ra bởi Trần Đức Duy, sinh viên của TUM và HCMUT, với mong muốn giúp giáo viên tiết kiệm thời gian trong những công việc đơn giản nhưng lặp lại hằng ngày như soạn đề, tạo phiếu học tập, viết nhận xét học sinh và chuẩn bị tài liệu giảng dạy.</p><p>Mục tiêu của Classora không phải là thay thế giáo viên, mà là giúp giáo viên có thêm thời gian cho những việc quan trọng hơn: giảng dạy, hỗ trợ học sinh và cải thiện chất lượng bài học.</p></div></div></section>

    <section className="mx-auto max-w-6xl px-4 py-16"><div className="rounded-lg bg-ink px-6 py-10 text-white md:px-10"><h2 className="text-3xl font-bold">Dùng thử Classora bản demo</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">Khám phá workflow hiện tại và gửi góp ý để sản phẩm gần hơn với công việc thật của giáo viên.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard" className="btn-primary">Mở dashboard</Link><Link href="/feedback" className="btn-secondary">Góp ý cho Classora</Link></div></div></section>

    <section className="border-t border-line bg-slate-50"><div className="mx-auto max-w-6xl px-4 py-14"><p className="text-sm font-bold uppercase text-brand">Trạng thái hiện tại</p><h2 className="mt-2 text-2xl font-bold text-ink">Bản demo trung thực, dữ liệu nằm trên máy của bạn</h2><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{["MVP/demo", "Chưa dùng AI thật", "Chưa thu phí", "Không lưu lên server", "Dữ liệu chỉ ở localStorage"].map((item) => <div key={item} className="card p-4 text-sm font-semibold text-ink">{item}</div>)}</div><p className="mt-5 max-w-3xl text-sm leading-6 text-muted">Mục tiêu hiện tại là kiểm tra quy trình với giáo viên thật trước khi đầu tư vào AI, tài khoản và hạ tầng dữ liệu.</p></div></section>
    <SiteFooter />
  </main>;
}
