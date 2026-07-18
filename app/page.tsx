import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Code2,
  Download,
  FileCheck2,
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
  [FileText, "Soạn tài liệu", "Đề kiểm tra, giáo án, phiếu học tập và đề cương."],
  [ClipboardCheck, "Kiểm tra và chuẩn hóa", "Rà soát cấu trúc, đáp án, ma trận và chất lượng đề."],
  [Sigma, "Trực quan hóa bằng TikZ", "Dựng lại hình học, đồ thị và sơ đồ thành mã chỉnh sửa được."],
  [Download, "Xuất tài liệu", "Tiếp tục làm việc với Word, PDF, Excel và PowerPoint."],
] as const;

const steps = [
  ["Chọn công cụ", "Bắt đầu từ đúng công việc thay vì một ô chat trống."],
  ["Nhập môn, lớp và nội dung", "Cấu hình yêu cầu theo tài liệu cần tạo."],
  ["Rà soát và chỉnh sửa", "Kiểm tra từng phần trước khi xác nhận kết quả."],
  ["Xuất tài liệu hoàn chỉnh", "Tải file, in hoặc lưu lịch sử để dùng lại."],
] as const;

const workflowGroups = [
  ["Đánh giá", ["Tạo đề kiểm tra", "Ma trận & bảng đặc tả", "Kiểm tra chất lượng đề", "Lời giải & đáp án", "Trộn mã đề", "Phiếu trả lời", "Chấm bài"]],
  ["Tài liệu dạy học", ["Giáo án", "Phiếu học tập", "Đề cương ôn tập"]],
  ["Quản lý & tái sử dụng", ["Ngân hàng câu hỏi", "Lịch sử tài liệu", "Ngân hàng TikZ"]],
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
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,.85fr)_minmax(620px,1.15fr)] lg:items-center lg:px-8 lg:py-24">
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
          <ProductWorkspacePreview />
        </div>
      </section>

      <section id="tinh-nang" className="border-b border-slate-200 bg-white scroll-mt-20">
        <div className="mx-auto grid max-w-7xl divide-y divide-slate-200 px-4 sm:px-6 md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4 lg:px-8">
          {capabilities.map(([Icon, title, copy]) => (
            <div key={title} className="flex gap-3 py-6 md:px-5 first:pl-0 last:pr-0">
              <Icon className="mt-0.5 shrink-0 text-blue-700" size={20} />
              <div><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="cach-hoat-dong" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
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

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Luồng tài liệu" title="Từ yêu cầu ban đầu đến tài liệu có thể sử dụng" copy="Các công cụ được nối theo công việc thật: tạo đề, kiểm tra, hoàn thiện đáp án, chuẩn bị mã đề và tiếp tục chấm bài." />
          <div className="mt-10 grid overflow-hidden border border-slate-200 bg-slate-50 lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
              {workflowGroups.map(([group, items], groupIndex) => (
                <div key={group} className="border-b border-slate-200 p-5 last:border-b-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                  <div className="mt-3 space-y-1">
                    {items.map((item, itemIndex) => <div key={item} className={`flex min-h-9 items-center gap-2 text-sm ${groupIndex === 0 && itemIndex === 0 ? "font-semibold text-blue-700" : "text-slate-600"}`}>{groupIndex === 0 && itemIndex === 0 ? <span className="h-5 w-0.5 bg-blue-600" /> : <span className="w-0.5" />}{item}</div>)}
                  </div>
                </div>
              ))}
            </div>
            <ExamDocumentMockup />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-medium text-slate-600" aria-label="Quy trình đề kiểm tra">
            {["Tạo đề", "Kiểm tra", "Lời giải", "Trộn mã", "Phiếu trả lời", "Chấm bài"].map((item, index) => <span key={item} className="inline-flex items-center gap-3">{index ? <ArrowRight className="text-slate-300" size={15} /> : null}{item}</span>)}
          </div>
        </div>
      </section>

      <section id="tikz" className="scroll-mt-20 bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-blue-300">Hình học &amp; trực quan</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Biến hình ảnh thành mã TikZ có thể chỉnh sửa</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">Tải ảnh hình học, đồ thị hoặc sơ đồ. SOẠN LAB nhận dạng cấu trúc, dựng lại hình và cho phép giáo viên rà soát mã trước khi sử dụng.</p>
          </div>
          <TikzComparison />
          <div className="mt-7 grid divide-y divide-slate-800 border-y border-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">
            {["Chỉnh điểm và nhãn", "Kiểm tra nét khuất", "Sao chép mã", "Xuất SVG, PNG, TEX", "Lưu vào Ngân hàng TikZ"].map((item) => <p key={item} className="flex min-h-14 items-center gap-2 px-3 text-sm text-slate-300 first:pl-0"><Check className="shrink-0 text-blue-400" size={16} />{item}</p>)}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
          <SectionHeading eyebrow="Tái sử dụng nội dung" title="Tạo một lần, chỉnh sửa và dùng lại" copy="Câu hỏi và tài liệu đã xác nhận có thể được tìm lại, tổ chức thành bộ và đưa vào công việc tiếp theo." />
          <QuestionBankMockup />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading eyebrow="Xuất & tiếp tục chỉnh sửa" title="Xuất file để tiếp tục làm việc theo cách của thầy cô" copy="SOẠN LAB tạo bản nháp có thể tiếp tục chỉnh sửa, in hoặc lưu trữ. Bản học sinh và bản giáo viên được tách rõ ở các công cụ phù hợp." />
            <p className="mt-4 text-sm leading-6 text-slate-500">Định dạng hỗ trợ phụ thuộc từng công cụ và loại tài liệu.</p>
          </div>
          <div className="grid border-y border-slate-200 sm:grid-cols-2">
            {[[FileText, "Word & PDF", "Đề, giáo án, phiếu học tập"], [FileSpreadsheet, "Excel", "Ma trận và dữ liệu có cấu trúc"], [Presentation, "PowerPoint", "Slide bài giảng"], [Code2, "TEX, SVG & PNG", "Hình TikZ và tài sản trực quan"]].map(([Icon, title, copy]) => {
              const I = Icon as typeof FileText;
              return <div key={title as string} className="flex gap-3 border-b border-slate-200 py-5 sm:border-r sm:px-5 sm:[&:nth-child(2n)]:border-r-0"><I className="shrink-0 text-blue-700" size={20} /><div><h3 className="font-semibold text-slate-950">{title as string}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{copy as string}</p></div></div>;
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Giá trị cốt lõi" title="Được thiết kế cho công việc thật của giáo viên" />
          <div className="mt-9 grid border-y border-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {values.map(([Icon, title, copy]) => <div key={title} className="border-b border-slate-200 py-6 md:border-r md:px-5 lg:border-b-0 first:pl-0 last:border-r-0 last:pr-0"><Icon className="text-blue-700" size={21} /><h3 className="mt-4 font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section id="dung-thu" className="scroll-mt-20 border-y border-blue-200 bg-blue-50/70 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700">Thử nghiệm giới hạn</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Đăng ký dùng thử SOẠN LAB</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">Tài khoản được cấp thủ công để nhóm phát triển có thể tiếp nhận phản hồi và cải thiện sản phẩm. Gửi yêu cầu không đồng nghĩa tài khoản được tạo ngay lập tức.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/dang-ky-dung-thu" className="btn-primary">Gửi yêu cầu dùng thử</Link>
            <Link href="/login" className="btn-secondary">Đã có tài khoản? Đăng nhập</Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 text-center sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dành ít thời gian hơn cho việc lặp lại.<br />Dành nhiều thời gian hơn cho việc dạy.</h2>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dang-ky-dung-thu" className="btn-primary min-h-12 px-5">Đăng ký dùng thử</Link>
            <Link href="/login" className="btn-secondary min-h-12 px-5">Đăng nhập</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return <div className="max-w-3xl"><p className="text-sm font-semibold text-blue-700">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] text-slate-950 sm:text-4xl">{title}</h2>{copy ? <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">{copy}</p> : null}</div>;
}

function ProductWorkspacePreview() {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-[0_24px_70px_rgba(15,23,42,.14)]" aria-label="Minh họa giao diện tạo đề kiểm tra của SOẠN LAB">
      <div className="flex h-10 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4"><span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-slate-300" /><span className="size-2.5 rounded-full bg-blue-400" /><span className="ml-3 truncate text-[11px] font-medium text-slate-500">SOẠN LAB · Tạo đề kiểm tra</span></div>
      <div className="grid min-h-[430px] sm:grid-cols-[175px_minmax(0,1fr)]">
        <div className="hidden border-r border-slate-200 bg-slate-950 p-4 text-slate-300 sm:block">
          <p className="text-xs font-bold tracking-wide text-white">SOẠN LAB</p>
          <div className="mt-6 space-y-1 text-xs">{["Trang tổng quan", "Tạo đề kiểm tra", "Ma trận & đặc tả", "Ngân hàng câu hỏi", "Lịch sử"].map((item, index) => <div key={item} className={`flex min-h-9 items-center border-l-2 px-3 ${index === 1 ? "border-blue-400 bg-white/10 text-white" : "border-transparent"}`}>{item}</div>)}</div>
        </div>
        <div className="min-w-0 bg-slate-100 p-3 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold text-blue-700">ĐÁNH GIÁ & KIỂM TRA</p><h2 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">Tạo đề kiểm tra</h2></div><span className="text-xs font-medium text-slate-500">Đã lưu bản nháp</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-[190px_minmax(0,1fr)]">
            <div className="border border-slate-200 bg-white p-3 text-xs text-slate-600"><p className="font-semibold text-slate-900">Thiết lập đề</p>{["Môn học: Toán", "Lớp: 12", "Thời gian: 90 phút", "Cấu trúc: 3 phần"].map((row) => <p key={row} className="mt-3 border-b border-slate-100 pb-2">{row}</p>)}<div className="mt-4 h-9 bg-blue-600 text-center font-semibold leading-9 text-white">Tạo đề kiểm tra</div></div>
            <div className="min-h-[300px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="grid grid-cols-2 gap-4 text-center text-[9px] font-medium text-slate-700"><div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div><div>ĐỀ KIỂM TRA HỌC KỲ</div></div><div className="mx-auto mt-5 h-px w-24 bg-slate-700" /><h3 className="mt-5 text-center text-sm font-bold text-slate-950">MÔN: TOÁN 12</h3><p className="mt-2 text-center text-[10px] text-slate-500">Thời gian làm bài: 90 phút</p><div className="mt-6 space-y-3 text-[10px] leading-4 text-slate-700"><p><strong>PHẦN I.</strong> Câu trắc nghiệm nhiều phương án lựa chọn.</p><p><strong>Câu 1.</strong> Cho hàm số có bảng biến thiên như hình dưới. Mệnh đề nào đúng?</p><div className="grid grid-cols-2 gap-2"><span>A. Hàm số đồng biến</span><span>B. Hàm số nghịch biến</span><span>C. Có hai cực trị</span><span>D. Không có cực trị</span></div><p><strong>PHẦN II.</strong> Câu trắc nghiệm đúng sai.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamDocumentMockup() {
  return <div className="min-w-0 p-4 sm:p-7"><div className="mx-auto max-w-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><p className="text-xs font-semibold text-blue-700">ĐỀ KIỂM TRA · BẢN NHÁP</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Đề kiểm tra học kỳ — Toán 12</h3></div><FileCheck2 className="text-blue-700" size={24} /></div><div className="mt-5 grid gap-5 md:grid-cols-[1fr_220px]"><div className="space-y-4 text-sm leading-6 text-slate-700"><p><strong>PHẦN I.</strong> Trắc nghiệm nhiều phương án lựa chọn</p>{[1,2,3].map((item) => <div key={item} className="border-b border-slate-100 pb-3"><strong>Câu {item}.</strong> Nội dung câu hỏi được tổ chức theo cấu trúc đã chọn.</div>)}</div><aside className="border-l border-slate-200 pl-4 text-sm"><p className="font-semibold text-slate-950">Kiểm tra trước khi xuất</p>{["Đủ số câu", "Đáp án đã tách", "Ma trận hợp lệ", "Cần giáo viên rà soát"].map((row, index) => <p key={row} className="mt-3 flex gap-2 text-slate-600"><span className={`mt-1 size-2 rounded-full ${index === 3 ? "bg-amber-500" : "bg-emerald-500"}`} />{row}</p>)}</aside></div></div></div>;
}

function TikzComparison() {
  return <div className="mt-10 grid overflow-hidden border border-slate-700 bg-slate-900 lg:grid-cols-3"><div className="border-b border-slate-700 p-5 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">1 · Ảnh nguồn</p><div className="mt-4 flex min-h-64 items-center justify-center bg-slate-100"><GeometryFigure rough /></div></div><div className="border-b border-slate-700 p-5 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">2 · Bản xem trước</p><div className="mt-4 flex min-h-64 items-center justify-center bg-white"><GeometryFigure /></div></div><div className="min-w-0 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-300">3 · Mã TikZ</p><pre className="mt-4 min-h-64 overflow-x-auto bg-slate-950 p-4 text-xs leading-6 text-slate-300"><code>{`\\begin{tikzpicture}[scale=1]\n  \\coordinate (S) at (2,3);\n  \\coordinate (A) at (0,0);\n  \\coordinate (B) at (3,0);\n  \\coordinate (C) at (4,1);\n  \\coordinate (D) at (1,1);\n  \\draw (A)--(B)--(C);\n  \\draw[dashed] (C)--(D)--(A);\n  \\draw (S)--(A) (S)--(B) (S)--(C);\n  \\draw[dashed] (S)--(D);\n\\end{tikzpicture}`}</code></pre></div></div>;
}

function GeometryFigure({ rough = false }: { rough?: boolean }) {
  return <svg viewBox="0 0 240 180" className={`h-48 w-64 max-w-full ${rough ? "rotate-1 opacity-75" : ""}`} role="img" aria-label="Hình chóp S.ABCD với các cạnh khuất nét đứt"><g fill="none" stroke="#1e293b" strokeWidth={rough ? 2.5 : 2}><path d="M115 20 L35 135 L150 142 L205 108 L80 102 Z" /><path d="M115 20 L150 142 M115 20 L205 108" /><path d="M115 20 L80 102 M80 102 L205 108" strokeDasharray="6 5" /></g>{[[115,16,"S"],[25,145,"A"],[150,158,"B"],[211,111,"C"],[68,99,"D"]].map(([x,y,label]) => <text key={label as string} x={x as number} y={y as number} fill="#0f172a" fontSize="13" fontWeight="600">{label as string}</text>)}</svg>;
}

function QuestionBankMockup() {
  return <div className="overflow-hidden border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4"><ClipboardList className="text-blue-700" size={20} /><strong className="text-slate-950">Ngân hàng câu hỏi</strong><span className="ml-auto text-xs text-slate-500">Tìm kiếm · Bộ câu hỏi · Lịch sử</span></div><div className="grid sm:grid-cols-[170px_minmax(0,1fr)]"><aside className="hidden border-r border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:block"><p className="font-semibold text-slate-900">Bộ câu hỏi</p>{["Tất cả câu hỏi", "Toán 12", "Ôn tập học kỳ"].map((item, index) => <p key={item} className={`mt-3 ${index === 1 ? "font-semibold text-blue-700" : ""}`}>{item}</p>)}</aside><div className="min-w-0 p-4"><div className="h-10 border border-slate-200 bg-slate-50 px-3 text-sm leading-10 text-slate-400">Tìm nội dung, đáp án, chủ đề…</div><div className="mt-3 border-t border-slate-200">{["Khảo sát sự biến thiên của hàm số", "Giá trị lớn nhất và nhỏ nhất", "Tiệm cận của đồ thị hàm số"].map((item, index) => <div key={item} className="flex gap-3 border-b border-slate-200 py-4"><span className="text-xs font-semibold text-blue-700">0{index+1}</span><div><p className="text-sm font-semibold text-slate-900">{item}</p><p className="mt-1 text-xs text-slate-500">Toán · Lớp 12 · Có đáp án và lời giải</p></div></div>)}</div></div></div></div>;
}
