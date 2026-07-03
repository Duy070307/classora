import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  PenTool,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/Sidebar";
import { sampleLinks } from "@/lib/sample-prefill";

const steps = [
  ["01", "Chọn công cụ", "Vào Dashboard hoặc trang Công cụ, chọn đúng luồng cho tài liệu cần tạo.", LayoutDashboard],
  ["02", "Nhập thông tin", "Điền môn, lớp, chủ đề, số lượng câu hỏi hoặc yêu cầu cụ thể bằng biểu mẫu.", CheckCircle2],
  ["03", "Tạo và rà soát", "Tạo bản nháp, đọc lại nội dung, kiểm tra đáp án và chỉnh sửa trước khi dùng.", ShieldCheck],
] as const;

const tools = [
  ["Tạo đề kiểm tra", "Đề, đáp án, thang điểm và ma trận.", "/tools/exam-generator", PenTool],
  ["Phiếu học tập", "Mục tiêu, kiến thức cần nhớ và bài tập.", "/tools/worksheet-generator", FileText],
  ["Kế hoạch bài dạy", "Mục tiêu, hoạt động học và đánh giá.", "/tools/lesson-plan-generator", BookOpenCheck],
  ["Nhận xét học sinh", "Nhận xét tự nhiên, tích cực, dễ chỉnh sửa.", "/tools/student-comments", MessageSquareText],
  ["Ngân hàng câu hỏi", "Lưu và tái sử dụng câu hỏi cục bộ.", "/question-bank", CheckCircle2],
] as const;

const quickSamples = [
  ["Toán 12 THPTQG", sampleLinks.math12Thptqg, PenTool],
  ["Lịch sử 12 THPTQG", sampleLinks.history12Thptqg, BookOpenCheck],
  ["Phiếu học tập Toán 8", sampleLinks.worksheetMath8, FileText],
] as const;

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Bắt đầu với Soạn Lab"
          description="Một hướng dẫn ngắn để giáo viên chọn công cụ, tạo bản nháp, rà soát và xuất tài liệu đầu tiên."
        />

        <section className="app-gradient-hero motion-enter mb-8 p-6 sm:p-8">
          <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full border-[30px] border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <Clock3 size={14} /> Bắt đầu trong 3 bước
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight">
              Từ thông tin bài học đến bản Word đầu tiên
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-blue-100">
              Chọn công cụ phù hợp, nhập thông tin bằng biểu mẫu, tạo bản nháp rồi xuất Word/PDF hoặc lưu lịch sử.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2 text-sm font-bold text-indigo-700 shadow-lg">
                Bắt đầu sử dụng
              </Link>
              <Link href="/samples" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold text-white">
                Xem mẫu nhanh <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Bắt đầu trong 3 bước</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, text, Icon]) => (
              <article key={number} className="card app-card-hover p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-indigo-600">{number}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><Icon size={19} /></span>
                </div>
                <h3 className="mt-5 font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <span className="app-badge">Gợi ý cho lần đầu</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">Công cụ nên thử trước</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {tools.map(([title, text, href, Icon]) => (
              <Link key={href} href={href} className="card app-card-hover group flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-indigo-700"><Icon size={21} /></span>
                <div className="min-w-0 flex-1"><h3 className="font-bold text-ink">{title}</h3><p className="mt-1 text-sm text-muted">{text}</p></div>
                <ArrowRight size={17} className="shrink-0 text-indigo-600 transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="app-badge">Mẫu nhanh nên dùng</span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">Thử nhanh bằng mẫu có sẵn</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Mở công cụ với thông tin đã điền thử, sau đó chỉnh sửa theo lớp học thật.</p>
            </div>
            <Link href="/samples" className="btn-secondary">Xem tất cả mẫu</Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {quickSamples.map(([title, href, Icon]) => (
              <Link key={href} href={href} className="card app-card-hover flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700"><Icon size={18} /></span>
                <span className="font-bold text-ink">{title}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <span className="app-badge bg-white text-amber-700">Lưu ý khi rà soát nội dung</span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">Giáo viên vẫn là người quyết định cuối cùng</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-amber-900">
            <li>• Kiểm tra lại đáp án, thang điểm và độ phù hợp với lớp học.</li>
            <li>• Chỉnh sửa cách diễn đạt trước khi gửi học sinh hoặc phụ huynh.</li>
            <li>• Với đề kiểm tra, nên rà lại cấu trúc, mức độ nhận thức và thời lượng làm bài.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
