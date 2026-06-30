import Link from "next/link";
import {
  ArrowRight,
  Check,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandLogo } from "@/components/BrandLogo";
import { SoanLabBadge } from "@/components/ui/SoanLabBadge";
import { SoanLabIcon, iconNameFromText } from "@/components/ui/SoanLabIcon";
import { SoanLabIllustration } from "@/components/ui/SoanLabIllustration";

const stats = [
  ["20+", "công cụ", "Cho soạn đề và tài liệu"],
  ["4", "kiểu xuất", "Word, PDF, Markdown, TXT"],
  ["Local", "dữ liệu", "Lưu trên trình duyệt"],
  ["20+", "quy trình", "Hỗ trợ công việc giảng dạy"],
];
const tools = [
  ["Tạo đề kiểm tra", "Đề, đáp án và ma trận.", "Phổ biến"],
  ["Tạo ma trận đề", "Phân bổ câu hỏi rõ ràng.", "Hữu ích"],
  ["Đáp án & thang điểm", "Hỗ trợ chấm bài.", ""],
  ["Phiếu học tập", "Bài tập theo chủ đề.", ""],
  ["Giáo án", "Tiến trình dạy học.", ""],
  ["Nhận xét học sinh", "Bản nháp dễ chỉnh sửa.", ""],
  ["Nhận xét hàng loạt", "Nhập nhanh bằng CSV.", "Hữu ích"],
  ["Ngân hàng câu hỏi", "Lưu và tái sử dụng.", ""],
  ["Mẫu tài liệu", "Dùng lại format quen thuộc.", ""],
];
export default function HomePage() {
  return (
    <main className="warm-page">
      <Navbar />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:py-18 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
            Dành cho giáo viên Việt Nam
          </span>
          <div className="mt-6">
            <BrandLogo variant="full" />
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            Soạn đề <span className="text-blue-600">nhanh.</span>
            <br />
            Tạo tài liệu <span className="text-cyan-500">gọn.</span>
            <br />
            Xuất Word <span className="text-indigo-600">dễ dàng.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            Soạn Lab giúp giáo viên tạo đề kiểm tra, phiếu học tập, ma trận đề,
            nhận xét học sinh và xuất Word trong vài phút.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn-primary min-h-13 px-6">
              Bắt đầu sử dụng
              <ArrowRight size={18} />
            </Link>
            <Link href="#how-it-works" className="btn-secondary min-h-13 px-6">
              Xem cách hoạt động
            </Link>
            <Link href="/samples" className="btn-secondary min-h-13 px-6">
              Mẫu sử dụng
            </Link>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Tạo bản nháp · Lưu lịch sử · Xuất Word/PDF
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[3rem] sm:overflow-visible">
          <div className="absolute -inset-7 rounded-[3rem] bg-gradient-to-br from-cyan-200/50 to-indigo-200/50 blur-2xl" />
          <SoanLabIllustration variant="workspace" className="relative max-w-xl p-5 sm:p-6" />
          {["Xuất Word", "Tạo đề kiểm tra", "Lưu lịch sử", "Mẫu tài liệu"].map((x, i) => (
            <span
              key={x}
              className={`absolute hidden rounded-full bg-white px-3 py-2 text-xs font-extrabold text-blue-700 shadow-xl sm:inline-flex ${i === 0 ? "-right-4 top-16" : i === 1 ? "-left-3 bottom-24" : i === 2 ? "right-4 -bottom-3" : "left-8 top-2"}`}
            >
              {x}
            </span>
          ))}
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([n, t, s]) => (
          <div key={t} className="play-card border-b-4 border-b-blue-500 p-6">
            <p className="text-3xl font-black text-blue-600">{n}</p>
            <p className="mt-1 font-extrabold text-slate-900">{t}</p>
            <p className="mt-2 text-sm text-slate-500">{s}</p>
          </div>
        ))}
      </section>
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20">
        <div className="text-center">
          <span className="soft-badge">Quy trình đơn giản</span>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Ba bước để có bản nháp đầu tiên.
          </h2>
          <p className="mt-3 text-slate-600">
            Chọn công cụ, nhập thông tin, rồi xuất Word hoặc lưu lịch sử.
          </p>
        </div>
        <div className="mt-12 space-y-8">
          {[
            [
              "Chọn đúng công cụ",
              ["Tạo đề", "Phiếu học tập", "Nhận xét học sinh"],
              "tiles",
            ],
            [
              "Nhập thông tin bằng form rõ ràng",
              ["Không cần viết prompt dài", "Có mẫu nhanh", "Có lưu nháp"],
              "form",
            ],
            [
              "Xuất tài liệu để chỉnh sửa",
              ["Word", "Print/PDF", "Lưu lịch sử"],
              "document",
            ],
          ].map(([title, bullets, type], i) => (
            <div
              key={title as string}
              className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <Visual type={type as string} />
              <div className="px-2 sm:px-8">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-black text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-3xl font-black text-slate-950">
                  {title as string}
                </h3>
                <ul className="mt-5 space-y-3">
                  {(bullets as string[]).map((x) => (
                    <li
                      key={x}
                      className="flex items-center gap-3 font-semibold text-slate-600"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <Check size={14} />
                      </span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="tools" className="bg-blue-50/60 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <span className="soft-badge">Một không gian làm việc</span>
          <h2 className="mt-4 text-4xl font-black text-slate-950">
            Nhiều công cụ, một nơi.
          </h2>
          <p className="mt-3 text-slate-600">
            Từ soạn đề đến nhận xét học sinh, mọi thứ nằm trong cùng một app.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {tools.map(([t, d, b]) => {
              return (
                <article
                  key={t as string}
                  className="play-card group p-6 transition hover:-translate-y-1"
                >
                  <div className="flex justify-between">
                    <SoanLabIcon name={iconNameFromText(t as string)} />
                    {b ? (
                      <SoanLabBadge tone={(b as string) === "Demo" ? "demo" : (b as string) === "Hữu ích" ? "useful" : "popular"}>{b as string}</SoanLabBadge>
                    ) : null}
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                    {t as string}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{d as string}</p>
                  <ArrowRight
                    className="mt-5 text-blue-600 transition group-hover:translate-x-1"
                    size={18}
                  />
                </article>
              );
            })}
          </div>
          <Link href="/tools" className="btn-primary mt-8">
            Xem tất cả công cụ
            <ArrowRight size={17} />
          </Link>
          <Link href="/samples" className="btn-secondary ml-3 mt-8">
            Mẫu sử dụng
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid items-center gap-10 rounded-[36px] bg-gradient-to-br from-blue-600 to-indigo-700 p-7 text-white shadow-[0_24px_65px_rgba(37,99,235,.2)] sm:p-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold ring-1 ring-white/20">
              Quy trình giáo viên
            </span>
            <h2 className="mt-5 text-4xl font-black tracking-tight">
              Tập trung vào bài dạy, không phải thao tác lặp lại.
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              Soạn Lab gom các bước chuẩn bị tài liệu vào một luồng rõ ràng để
              giáo viên luôn biết nên làm gì tiếp theo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Chuẩn bị", "Chọn môn, lớp và chủ đề.", GraduationCap],
              ["Tạo nháp", "Dùng form thay cho prompt dài.", Sparkles],
              ["Rà soát", "Xuất Word và chỉnh sửa.", ShieldCheck],
            ].map(([title, text, Icon]) => {
              const StepIcon = Icon as typeof GraduationCap;
              return (
                <div
                  key={title as string}
                  className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15"
                >
                  <StepIcon size={22} className="text-cyan-200" />
                  <h3 className="mt-4 font-extrabold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100">
                    {text as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-y border-blue-100 bg-white/70 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2">
          <div className="play-card p-7 sm:p-9">
            <span className="soft-badge">Quy trình đáng tin cậy</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              Tạo bản nháp nhanh, luôn có bước rà soát.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Nội dung được tạo tự động và cần giáo viên kiểm tra, chỉnh sửa
              trước khi sử dụng chính thức.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Tạo bản nháp",
                "Xuất Word/PDF",
                "Lưu lịch sử",
                "Dữ liệu trên trình duyệt",
              ].map((x) => (
                <SoanLabBadge key={x} tone={x.includes("trình duyệt") ? "local" : x.includes("Word") ? "export" : "useful"}>{x}</SoanLabBadge>
              ))}
            </div>
            <Link href="/known-issues" className="btn-secondary mt-7">
              Xem trạng thái hệ thống
            </Link>
          </div>
          <div className="play-card p-7 sm:p-9">
            <span className="soft-badge">Người tạo sản phẩm</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              Được xây dựng từ những công việc giáo viên làm mỗi ngày.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Soạn Lab được tạo bởi Trần Đức Duy với mong muốn giảm thời gian
              cho những việc lặp lại như soạn đề, chuẩn bị phiếu học tập và viết
              nhận xét.
            </p>
            <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
              Mục tiêu không phải thay thế giáo viên, mà giúp giáo viên có thêm
              thời gian cho học sinh và chất lượng bài dạy.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="play-card relative overflow-hidden p-8 sm:p-12">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-100" />
          <div className="relative max-w-3xl">
            <BrandLogo variant="mark" />
            <h2 className="mt-6 text-4xl font-black text-slate-950">
              Sẵn sàng tạo tài liệu đầu tiên với Soạn Lab?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Mở dashboard, chọn một mẫu nhanh hoặc bắt đầu từ công cụ quen
              thuộc để tạo bản nháp và xuất Word/PDF.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">
                Mở dashboard
              </Link>
              <Link href="/samples" className="btn-secondary">
                Mẫu sử dụng
              </Link>
              <Link href="/tools" className="btn-secondary">
                Xem công cụ
              </Link>
            </div>
          </div>
          <SoanLabIllustration variant="export" className="relative mt-8 max-w-sm lg:absolute lg:bottom-8 lg:right-10 lg:mt-0" />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function Visual({ type }: { type: string }) {
  return (
    <div className="rounded-[32px] bg-gradient-to-br from-sky-100 to-indigo-100 p-6 sm:p-10">
      <div className="play-card mx-auto max-w-md p-5">
        {type === "form" ? (
          <div className="space-y-3">
            {["Môn học", "Lớp", "Chủ đề"].map((x) => (
              <div key={x}>
                <p className="mb-1 text-xs font-bold text-slate-500">{x}</p>
                <div className="h-10 rounded-xl border border-slate-200 bg-slate-50" />
              </div>
            ))}
            <div className="h-11 rounded-xl bg-blue-600" />
          </div>
        ) : type === "document" ? (
          <div>
            <div className="mx-auto h-48 max-w-xs rounded-lg border border-slate-100 bg-white p-5 shadow-lg">
              <div className="h-3 w-1/2 rounded bg-blue-100" />
              <div className="mt-5 space-y-3">
                {[1, 2, 3, 4].map((x) => (
                  <div key={x} className="h-2 rounded bg-slate-100" />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              {["Word", "PDF", "Lịch sử"].map((x) => (
                <span key={x} className="soft-badge">
                  {x}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {["Tạo đề", "Phiếu học tập", "Nhận xét", "Ma trận"].map((x) => (
              <div key={x} className="rounded-2xl bg-blue-50 p-4">
                <SoanLabIcon name={iconNameFromText(x)} size="sm" />
                <p className="mt-3 text-sm font-extrabold">{x}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
