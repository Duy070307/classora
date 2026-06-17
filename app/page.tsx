import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PricingCard } from "@/components/PricingCard";
import { ToolCategorySection } from "@/components/ToolCategorySection";
import { categoryLabels, categoryOrder, toolRegistry } from "@/lib/tool-registry";

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <section className="bg-white">
        <div className="mx-auto grid min-h-[620px] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800">
              <ShieldCheck size={16} />
              AI tool hub cho giáo viên Việt Nam
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-normal text-ink md:text-6xl">Classora</h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-muted">Soạn đề, tạo tài liệu, xuất Word trong vài phút.</p>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Tạo nhanh bản nháp đề kiểm tra, phiếu học tập và nhận xét học sinh bằng tiếng Việt. Phù hợp để giáo viên rà soát, chỉnh sửa và xuất Word cho tiết dạy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">
                Vào dashboard
                <ArrowRight size={16} />
              </Link>
              <Link href="/tools/exam-generator" className="btn-secondary">Tạo đề thử</Link>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 text-sm text-slate-600 sm:grid-cols-3">
              {["Không cần đăng nhập", "Lưu lịch sử trên máy", "Xuất Word .docx"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-mint" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line bg-slate-50 p-4 shadow-soft">
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand">Bản nháp tài liệu</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">Đề kiểm tra Toán lớp 7</h2>
                </div>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Demo</span>
              </div>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <p className="font-semibold text-ink">I. Trắc nghiệm</p>
                <p>1. Khi giải bài toán về tỉ lệ thức, bước nào cần thực hiện trước?</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <span className="rounded border border-slate-200 px-3 py-2">A. Đọc kỹ dữ kiện</span>
                  <span className="rounded border border-slate-200 px-3 py-2">B. Chọn đáp án bất kỳ</span>
                </div>
                <p className="font-semibold text-ink">II. Tự luận</p>
                <p>Trình bày lời giải, kết luận và thang điểm gợi ý cho giáo viên.</p>
                <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">Nội dung do AI tạo, giáo viên nên kiểm tra lại trước khi sử dụng.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Công cụ MVP</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Tạo tài liệu dạy học nhanh hơn</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">Tập trung vào các việc giáo viên thường cần chuẩn bị trước giờ lên lớp hoặc cuối kỳ.</p>
        </div>
        <div className="mt-8 space-y-8">
          {categoryOrder.slice(0, 3).map((category) => (
            <ToolCategorySection key={category} title={categoryLabels[category]} tools={toolRegistry.filter((tool) => tool.category === category).slice(0, 6)} />
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-sm font-bold uppercase tracking-wide text-brand">Gói sử dụng</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Đơn giản cho bản MVP</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <PricingCard name="Free" price="0đ" features={["10 lượt tạo mỗi tháng", "Lưu lịch sử trên trình duyệt", "Xuất Word cơ bản"]} />
            <PricingCard name="Pro cá nhân" price="Sắp có" features={["Nhiều lượt tạo hơn", "Mẫu tài liệu nâng cao", "Tùy biến giọng văn"]} />
            <PricingCard name="Tổ chuyên môn" price="Sắp có" features={["Không gian dùng chung", "Quản lý mẫu theo tổ", "Báo cáo sử dụng"]} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="card grid gap-8 p-6 md:grid-cols-[0.85fr_1.15fr] md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Founder note</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Về người tạo ra Classora</h2>
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Classora hiện đang ở giai đoạn MVP/demo và sẽ tiếp tục được cải thiện dựa trên góp ý thực tế từ giáo viên.
            </p>
          </div>
          <div>
            <div className="space-y-4 text-sm leading-7 text-slate-700 md:text-base">
              <p>
                Classora được tạo ra bởi Trần Đức Duy, sinh viên của TUM và HCMUT, với mong muốn giúp giáo viên tiết kiệm thời gian trong những công việc đơn giản nhưng lặp lại hằng ngày như soạn đề, tạo phiếu học tập, viết nhận xét học sinh và chuẩn bị tài liệu giảng dạy.
              </p>
              <p>
                Mục tiêu của Classora không phải là thay thế giáo viên, mà là giúp giáo viên có thêm thời gian cho những việc quan trọng hơn: giảng dạy, hỗ trợ học sinh và cải thiện chất lượng bài học.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tools" className="btn-primary">
                Khám phá công cụ
                <ArrowRight size={16} />
              </Link>
              <Link href="/feedback" className="btn-secondary">Góp ý cho Classora</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white px-4 py-8 text-center text-sm text-muted">
        <p>Classora - Soạn đề, tạo tài liệu, xuất Word trong vài phút.</p>
        <p className="mt-2">Được xây dựng để hỗ trợ giáo viên Việt Nam.</p>
      </footer>
    </main>
  );
}
