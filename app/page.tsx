import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Download,
  FileSpreadsheet,
  FileText,
  Layers3,
  Presentation,
  RefreshCw,
  ShieldCheck,
  Sigma,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { LandingTikzShowcase } from "@/components/landing/LandingTikzShowcase";
import { HeroProductVisual, QuestionBankProductVisual } from "@/components/landing/PublicProductVisuals";
import { AssessmentWorkflowStory, TeachingDocumentWorkflow } from "@/components/landing/PublicWorkflowStories";

const description = "Tạo đề kiểm tra, giáo án, phiếu học tập, ma trận, lời giải và hình TikZ; rà soát, chỉnh sửa và xuất Word/PDF.";

export const metadata: Metadata = {
  title: { absolute: "SOẠN LAB – Bộ công cụ AI hỗ trợ giáo viên" },
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "SOẠN LAB – Bộ công cụ AI hỗ trợ giáo viên",
    description,
    locale: "vi_VN",
    type: "website",
    images: [{ url: "/og-image.png", alt: "SOẠN LAB — Bộ công cụ hỗ trợ giáo viên Việt Nam" }],
  },
  twitter: { card: "summary_large_image", title: "SOẠN LAB – Bộ công cụ AI hỗ trợ giáo viên", description, images: ["/og-image.png"] },
};

const capabilities = [
  [FileText, "Soạn tài liệu", "Đề kiểm tra, giáo án, phiếu học tập và đề cương.", "text-violet-700"],
  [ClipboardCheck, "Kiểm tra và chuẩn hóa", "Rà soát cấu trúc, đáp án, ma trận và chất lượng đề.", "text-amber-700"],
  [Sigma, "Trực quan hóa bằng TikZ", "Dựng lại hình học, đồ thị và sơ đồ thành mã chỉnh sửa được.", "text-cyan-700"],
  [Download, "Xuất tài liệu", "Tiếp tục làm việc với Word, PDF, Excel và PowerPoint.", "text-blue-700"],
] as const;

const steps = [
  ["Chọn công cụ", "Bắt đầu từ đúng công việc thay vì một ô chat trống."],
  ["Nhập môn, lớp và nội dung", "Cấu hình yêu cầu theo tài liệu cần tạo."],
  ["Rà soát và chỉnh sửa", "Kiểm tra từng phần trước khi xác nhận kết quả."],
  ["Xuất tài liệu hoàn chỉnh", "Tải file, in hoặc lưu lịch sử để dùng lại."],
] as const;

const values = [
  [Layers3, "Có cấu trúc", "Mỗi công cụ có quy trình và trường nhập phù hợp với công việc giáo viên."],
  [ShieldCheck, "Có thể rà soát", "Giáo viên xem, sửa và xác nhận trước khi xuất tài liệu."],
  [RefreshCw, "Có thể tiếp tục chỉnh sửa", "Tài liệu đi tiếp sang các định dạng quen thuộc thay vì bị khóa trong hệ thống."],
  [BookOpenCheck, "Tập trung vào tài liệu tiếng Việt", "Môn, lớp và cách tổ chức nội dung gần với công việc giảng dạy thực tế."],
] as const;

export default function HomePage() {
  return (
    <main className="warm-page min-h-screen">
      <Navbar />

      <section id="noi-dung-chinh" tabIndex={-1} className="relative scroll-mt-16 overflow-hidden border-b border-slate-200 bg-white focus:outline-none">
        <div className="pointer-events-none absolute inset-0 soft-grid-bg opacity-70" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-blue-100/55 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 xl:grid-cols-[minmax(0,.85fr)_minmax(620px,1.15fr)] xl:items-center xl:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700">Bộ công cụ AI dành cho giáo viên Việt Nam</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.65rem]">
              Soạn tài liệu dạy học nhanh hơn. <span className="text-blue-700">Giữ quyền kiểm soát ở từng bước.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Tạo đề kiểm tra, giáo án, phiếu học tập, ma trận, lời giải và hình TikZ trong một quy trình có thể rà soát, chỉnh sửa và xuất Word/PDF.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/dang-ky-dung-thu" className="btn-primary min-h-12 px-5">
                Đăng ký dùng thử <ArrowRight size={18} />
              </Link>
              <Link href="/tools" className="btn-secondary min-h-12 px-5">Xem công cụ</Link>
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-500">
              <CheckCircle2 className="mt-0.5 shrink-0 text-blue-700" size={17} />
              Bản nháp luôn cần giáo viên rà soát trước khi sử dụng.
            </p>
          </div>
          <HeroProductVisual />
        </div>
      </section>

      <section id="tinh-nang" className="border-b border-slate-200 bg-white scroll-mt-20">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 lg:px-8">
          {capabilities.map(([Icon, title, copy, accent]) => (
            <div key={title} className="flex gap-3 py-6 md:px-5 first:pl-0 last:pr-0">
              <Icon className={`mt-0.5 shrink-0 ${accent}`} size={20} />
              <div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="cach-hoat-dong" className="scroll-mt-20 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Quy trình làm việc" title="Một quy trình rõ ràng, không phải một ô chat trống" copy="SOẠN LAB tổ chức công việc từ cấu hình đầu vào đến bản xuất cuối cùng để giáo viên luôn biết mình đang ở bước nào." />
          <ol className="mt-10 grid border-y border-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([title, copy], index) => (
              <li key={title} className="relative border-b border-slate-200 px-1 py-6 last:border-b-0 md:border-r md:px-6 md:first:pl-0 md:[&:nth-child(2)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r lg:last:border-r-0 lg:last:pr-0">
                <span className="text-sm font-semibold text-blue-700">0{index + 1}</span>
                <h3 className="mt-3 font-semibold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="assessment-workflow" className="scroll-mt-20 border-y border-blue-100 bg-blue-50/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="assessment-workflow-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="assessment-workflow-title" eyebrow="Quy trình đánh giá" title="Một luồng xuyên suốt từ tạo đề đến chấm bài" copy="Chọn từng bước để xem phần giao diện giáo viên sẽ làm việc. Mỗi kết quả đều có điểm dừng để rà soát trước khi đi tiếp." accentClass="text-amber-700" />
          <AssessmentWorkflowStory />
        </div>
      </section>

      <section id="teaching-workflow" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="teaching-workflow-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading id="teaching-workflow-title" eyebrow="Tài liệu dạy học" title="Nhiều loại tài liệu, cùng một cách làm việc" copy="Chọn loại tài liệu để xem cấu trúc đầu ra. Nội dung được tổ chức theo nhiệm vụ thay vì năm công cụ rời rạc." accentClass="text-violet-700" />
          <TeachingDocumentWorkflow />
        </div>
      </section>

      <section id="tikz" className="scroll-mt-20 border-y border-cyan-100 bg-cyan-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-cyan-700">Hình học &amp; trực quan</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">Biến hình ảnh thành mã TikZ có thể chỉnh sửa</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">Tải ảnh hình học, đồ thị hoặc sơ đồ. SOẠN LAB nhận dạng cấu trúc, dựng lại hình và cho phép giáo viên rà soát mã trước khi sử dụng.</p>
          </div>
          <LandingTikzShowcase />
          <div className="mt-7 grid divide-y divide-blue-200 border-y border-blue-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {["Chỉnh điểm và nhãn", "Kiểm tra nét khuất", "Sao chép mã", "Xuất SVG, PNG, TEX", "Lưu vào Ngân hàng TikZ"].map((item) => <p key={item} className="flex min-h-14 items-center gap-2 px-3 text-sm text-slate-700 first:pl-0"><Check className="shrink-0 text-cyan-700" size={16} />{item}</p>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <SectionHeading eyebrow="Tái sử dụng nội dung" title="Tạo một lần, chỉnh sửa và dùng lại" copy="Câu hỏi và tài liệu đã xác nhận có thể được tìm lại, tổ chức thành bộ và đưa vào công việc tiếp theo." />
          <QuestionBankProductVisual />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Xuất & tiếp tục chỉnh sửa" title="Xuất file để tiếp tục làm việc theo cách của thầy cô" copy="SOẠN LAB tạo bản nháp có thể tiếp tục chỉnh sửa, in hoặc lưu trữ. Bản học sinh và bản giáo viên được tách rõ ở các công cụ phù hợp." />
            <p className="mt-4 text-sm leading-6 text-slate-500">Định dạng hỗ trợ phụ thuộc từng công cụ và loại tài liệu.</p>
          </div>
          <div className="grid border-y border-slate-200 sm:grid-cols-2">
            {[[FileText, "Word & PDF", "Đề, giáo án, phiếu học tập", "text-blue-700"], [FileSpreadsheet, "Excel", "Ma trận và dữ liệu có cấu trúc", "text-amber-700"], [Presentation, "PowerPoint", "Slide bài giảng", "text-violet-700"], [Code2, "TEX, SVG & PNG", "Hình TikZ và tài sản trực quan", "text-cyan-700"]].map(([Icon, title, copy, accent]) => {
              const I = Icon as typeof FileText;
              return <div key={title as string} className="flex gap-3 border-b border-slate-200 py-5 sm:border-r sm:px-5 sm:[&:nth-child(2n)]:border-r-0"><I className={`shrink-0 ${accent as string}`} size={20} /><div><h3 className="font-semibold text-slate-950">{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{copy as string}</p></div></div>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Giá trị cốt lõi" title="Được thiết kế cho công việc thật của giáo viên" />
          <div className="mt-9 grid border-y border-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {values.map(([Icon, title, copy]) => <div key={title} className="border-b border-slate-200 py-6 md:border-r md:px-5 lg:border-b-0 first:pl-0 last:border-r-0 last:pr-0"><Icon className="text-blue-700" size={21} /><h3 className="mt-4 font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section id="dung-thu" className="scroll-mt-20 border-t border-slate-200 bg-white px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dành ít thời gian hơn cho việc lặp lại.<br />Dành nhiều thời gian hơn cho việc dạy.</h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dang-ky-dung-thu" className="btn-primary min-h-12 px-5">Đăng ký dùng thử</Link>
            <Link href="/login" className="btn-secondary min-h-12 px-5">Đăng nhập</Link>
          </div>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-600">Sau khi gửi yêu cầu, thầy/cô vui lòng chờ quản trị viên duyệt tài khoản.</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SectionHeading({ id, eyebrow, title, copy, accentClass = "text-blue-700" }: { id?: string; eyebrow: string; title: string; copy?: string; accentClass?: string }) {
  return <div className="max-w-3xl"><p className={`text-sm font-semibold ${accentClass}`}>{eyebrow}</p><h2 id={id} className="mt-3 text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">{title}</h2>{copy ? <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{copy}</p> : null}</div>;
}
