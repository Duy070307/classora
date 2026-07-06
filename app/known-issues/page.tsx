import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const issues = [
  "Nội dung được tạo tự động là bản nháp hỗ trợ giáo viên và cần được rà soát chuyên môn trước khi sử dụng.",
  "Dữ liệu có thể phụ thuộc vào tài khoản hoặc thiết bị đang sử dụng; nên xuất bản sao lưu định kỳ.",
  "Một số công cụ nhận diện ảnh cần ảnh được cắt gọn, rõ nét và không lẫn nhiều nội dung ngoài vùng cần xử lý.",
  "Công cụ ảnh công thức/hình học chưa phải hệ thống OCR cho toàn bộ trang PDF.",
  "Export Word ưu tiên khả năng đọc và chỉnh sửa, chưa đảm bảo giống 100% mọi mẫu Word phức tạp.",
  "Trộn mã đề và đáp án cần giáo viên kiểm tra lại thứ tự câu, mã đề và thang điểm.",
  "Giáo viên cần duyệt lại nội dung trước khi dùng trong kiểm tra, giảng dạy hoặc gửi cho phụ huynh.",
];

export default function KnownIssuesPage() {
  return (
    <main className="warm-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <div className="rounded-[32px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm sm:p-9">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-600" />
            <p className="text-sm font-black uppercase tracking-wide text-amber-700">Lưu ý sử dụng</p>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Giới hạn hiện tại</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Một vài ghi chú minh bạch để thầy/cô dùng Soạn Lab đúng phạm vi, an toàn và hiệu quả hơn.
          </p>
        </div>

        <section className="mt-8 rounded-[32px] border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <ul className="space-y-4">
            {issues.map((issue) => (
              <li key={issue} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                {issue}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/changelog" className="btn-secondary">Nhật ký cập nhật</Link>
          <Link href="/dashboard" className="btn-primary">Mở dashboard</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
