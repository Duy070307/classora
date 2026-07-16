import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Lightbulb, MessageCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GuideFeedbackButton } from "@/components/GuideFeedbackButton";

const checklist = [
  {
    title: "Tạo một đề kiểm tra",
    text: "Chọn môn, lớp, chủ đề và tạo thử một đề kiểm tra ngắn. Sau đó kiểm tra đáp án, thang điểm và mức độ phù hợp.",
    href: "/tools/exam-generator",
    example: ["Môn: Toán", "Lớp: 12", "Chủ đề: Xác suất"],
  },
  {
    title: "Xuất Word/PDF",
    text: "Mở tài liệu đã tạo, thử xuất Word hoặc PDF và kiểm tra định dạng, bảng biểu, công thức.",
    href: "/history",
    example: ["Kiểm tra header", "Kiểm tra bảng đáp án", "Kiểm tra công thức/ký hiệu"],
  },
  {
    title: "Tạo một giáo án tham khảo",
    text: "Nhập môn, lớp, chủ đề để tạo giáo án. Kiểm tra mục tiêu bài học, hoạt động giáo viên/học sinh và phần đánh giá.",
    href: "/tools/lesson-plan",
    example: ["Môn: Vật lý", "Lớp: 10", "Chủ đề: Khúc xạ ánh sáng"],
  },
  {
    title: "Thử ngân hàng câu hỏi",
    text: "Thêm thủ công hoặc nhập thử một vài câu hỏi, sau đó kiểm tra xem câu hỏi có lưu đúng không.",
    href: "/question-bank",
    example: ["Thêm câu hỏi", "Lọc theo môn/lớp", "Mở lại sau khi lưu"],
  },
  {
    title: "Thử công cụ công thức",
    text: "Nếu có ảnh công thức, thầy cô có thể thử công cụ Ảnh công thức → LaTeX hoặc Hình học → TikZ.",
    href: "/tools/image-to-latex",
    example: ["Cắt gọn ảnh", "Copy LaTeX/TikZ", "Kiểm tra bản nháp"],
  },
  {
    title: "Gửi góp ý",
    text: "Bấm nút Góp ý ở góc màn hình để gửi nhận xét về lỗi, nội dung chưa chính xác hoặc điểm còn khó dùng.",
    href: "#feedback-guide",
    example: ["Loại lỗi", "Công cụ đã dùng", "Điều muốn cải thiện"],
  },
];

const feedbackPrompts = [
  "Công cụ nào thầy cô đã dùng?",
  "Kết quả có đúng nhu cầu không?",
  "Có lỗi khi xuất Word/PDF không?",
  "Công thức, ký hiệu hoặc bảng biểu có bị lỗi không?",
  "Phần nào khó hiểu hoặc khó thao tác?",
  "Thầy cô muốn Soạn Lab cải thiện điều gì?",
];

export default function TeacherTestingGuidePage() {
  return (
    <AppShell title="Hướng dẫn dùng thử">
      <section className="rounded-[34px] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-black text-blue-700">
              <ClipboardCheck size={15} />
              Dành cho nhóm giáo viên dùng thử
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Hướng dẫn dùng thử Soạn Lab</h1>
            <p className="mt-3 text-base leading-8 text-slate-600">
              Thầy cô có thể dùng thử một vài công cụ chính, kiểm tra kết quả và gửi góp ý trực tiếp trong hệ thống.
            </p>
          </div>
          <Link href="/dashboard" className="btn-secondary">Về dashboard</Link>
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={22} />
          <p>
            <span className="font-black">Lưu ý về bản thử nghiệm: </span>
            Soạn Lab hiện đang ở bản thử nghiệm. Nội dung được tạo tự động chỉ là bản nháp hỗ trợ giáo viên, có thể còn sai sót về chuyên môn, đáp án, định dạng hoặc cách diễn đạt. Thầy cô vui lòng kiểm tra và chỉnh sửa trước khi sử dụng chính thức.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-950">Gợi ý các bước dùng thử</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Một vòng thử nhanh khoảng 10 phút để kiểm tra các luồng quan trọng nhất.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {checklist.map((item, index) => (
            <Link key={item.title} href={item.href} className="group rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.example.map((example) => (
                      <span key={example} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{example}</span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="mt-2 text-blue-600 transition group-hover:translate-x-1" size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="feedback-guide" className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[28px] border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <MessageCircle size={21} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">Khi góp ý, thầy cô có thể ghi những gì?</h2>
              <p className="mt-1 text-sm text-slate-500">Càng cụ thể thì nhóm phát triển càng dễ sửa đúng điểm cần cải thiện.</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {feedbackPrompts.map((item) => (
              <li key={item} className="flex gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={17} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
          <Lightbulb className="text-blue-700" size={26} />
          <h3 className="mt-3 text-lg font-black text-slate-950">Mẹo nhỏ khi thử</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Nên thử bằng một chủ đề quen thuộc để thầy cô dễ đánh giá độ đúng, cách trình bày và mức độ dùng được của bản nháp.
          </p>
          <div className="mt-4">
            <GuideFeedbackButton />
          </div>
        </aside>
      </section>

      <section className="mt-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="text-blue-700" size={24} />
          <h2 className="text-xl font-black text-slate-950">Đi nhanh tới công cụ cần thử</h2>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/tools/exam-generator" className="btn-primary">Tạo đề kiểm tra</Link>
          <Link href="/tools/lesson-plan" className="btn-secondary">Tạo giáo án</Link>
          <Link href="/question-bank" className="btn-secondary">Ngân hàng câu hỏi</Link>
          <Link href="/history" className="btn-secondary">Xem lịch sử</Link>
          <GuideFeedbackButton />
        </div>
      </section>
    </AppShell>
  );
}
