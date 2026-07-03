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
  ["20+", "công c?", "Cho so?n d? và tài li?u"],
  ["4", "ki?u xu?t", "Word, PDF, Markdown, TXT"],
  ["Local", "d? li?u", "Luu trên trình duy?t"],
  ["20+", "quy trình", "H? tr? công vi?c gi?ng d?y"],
];
const tools = [
  ["T?o d? ki?m tra", "Ð?, dáp án và ma tr?n.", "Ph? bi?n"],
  ["T?o ma tr?n d?", "Phân b? câu h?i rõ ràng.", "H?u ích"],
  ["Ðáp án & thang di?m", "H? tr? ch?m bài.", ""],
  ["Phi?u h?c t?p", "Bài t?p theo ch? d?.", ""],
  ["Giáo án", "Ti?n trình d?y h?c.", ""],
  ["Nh?n xét h?c sinh", "B?n nháp d? ch?nh s?a.", ""],
  ["Nh?n xét hàng lo?t", "Nh?p nhanh b?ng CSV.", "H?u ích"],
  ["Ngân hàng câu h?i", "Luu và tái s? d?ng.", ""],
  ["M?u tài li?u", "Dùng l?i format quen thu?c.", ""],
];
export default function HomePage() {
  return (
    <main className="warm-page">
      <Navbar />
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:py-18 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-extrabold text-blue-700 ring-1 ring-blue-100">
            Dành cho giáo viên Vi?t Nam
          </span>
          <div className="mt-6">
            <BrandLogo variant="full" />
          </div>
          <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-.04em] text-slate-950 sm:text-6xl lg:text-7xl">
            So?n d? <span className="text-blue-600">nhanh.</span>
            <br />
            T?o tài li?u <span className="text-cyan-500">g?n.</span>
            <br />
            Xu?t Word <span className="text-indigo-600">d? dàng.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            So?n Lab giúp giáo viên t?o d? ki?m tra, phi?u h?c t?p, ma tr?n d?,
            nh?n xét h?c sinh và xu?t Word trong vài phút.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="btn-primary min-h-13 px-6">
              B?t d?u s? d?ng
              <ArrowRight size={18} />
            </Link>
            <Link href="#how-it-works" className="btn-secondary min-h-13 px-6">
              Xem cách ho?t d?ng
            </Link>
            <Link href="/samples" className="btn-secondary min-h-13 px-6">
              M?u s? d?ng
            </Link>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-500">
            T?o b?n nháp · Luu l?ch s? · Xu?t Word/PDF
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[3rem] sm:overflow-visible">
          <div className="absolute -inset-7 rounded-[3rem] bg-gradient-to-br from-cyan-200/50 to-indigo-200/50 blur-2xl" />
          <SoanLabIllustration variant="workspace" className="relative max-w-xl p-5 sm:p-6" />
          {["Xu?t Word", "T?o d? ki?m tra", "Luu l?ch s?", "M?u tài li?u"].map((x, i) => (
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
          <span className="soft-badge">Quy trình don gi?n</span>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
            Ba bu?c d? có b?n nháp d?u tiên.
          </h2>
          <p className="mt-3 text-slate-600">
            Ch?n công c?, nh?p thông tin, r?i xu?t Word ho?c luu l?ch s?.
          </p>
        </div>
        <div className="mt-12 space-y-8">
          {[
            [
              "Ch?n dúng công c?",
              ["T?o d?", "Phi?u h?c t?p", "Nh?n xét h?c sinh"],
              "tiles",
            ],
            [
              "Nh?p thông tin b?ng form rõ ràng",
              ["Không c?n vi?t prompt dài", "Có m?u nhanh", "Có luu nháp"],
              "form",
            ],
            [
              "Xu?t tài li?u d? ch?nh s?a",
              ["Word", "Print/PDF", "Luu l?ch s?"],
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
          <span className="soft-badge">M?t không gian làm vi?c</span>
          <h2 className="mt-4 text-4xl font-black text-slate-950">
            Nhi?u công c?, m?t noi.
          </h2>
          <p className="mt-3 text-slate-600">
            T? so?n d? d?n nh?n xét h?c sinh, m?i th? n?m trong cùng m?t app.
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
                      <SoanLabBadge tone={(b as string).includes("H") ? "useful" : "popular"}>{b as string}</SoanLabBadge>
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
            Xem t?t c? công c?
            <ArrowRight size={17} />
          </Link>
          <Link href="/samples" className="btn-secondary ml-3 mt-8">
            M?u s? d?ng
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
              T?p trung vào bài d?y, không ph?i thao tác l?p l?i.
            </h2>
            <p className="mt-4 leading-7 text-blue-100">
              So?n Lab gom các bu?c chu?n b? tài li?u vào m?t lu?ng rõ ràng d?
              giáo viên luôn bi?t nên làm gì ti?p theo.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Chu?n b?", "Ch?n môn, l?p và ch? d?.", GraduationCap],
              ["T?o nháp", "Dùng form thay cho prompt dài.", Sparkles],
              ["Rà soát", "Xu?t Word và ch?nh s?a.", ShieldCheck],
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
            <span className="soft-badge">Quy trình dáng tin c?y</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              T?o b?n nháp nhanh, luôn có bu?c rà soát.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              N?i dung du?c t?o t? d?ng và c?n giáo viên ki?m tra, ch?nh s?a
              tru?c khi s? d?ng chính th?c.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "T?o b?n nháp",
                "Xu?t Word/PDF",
                "Luu l?ch s?",
                "D? li?u trên trình duy?t",
              ].map((x) => (
                <SoanLabBadge key={x} tone={x.includes("trình duy?t") ? "local" : x.includes("Word") ? "export" : "useful"}>{x}</SoanLabBadge>
              ))}
            </div>
            <Link href="/system-status" className="btn-secondary mt-7">
              Xem tr?ng thái h? th?ng
            </Link>
          </div>
          <div className="play-card p-7 sm:p-9">
            <span className="soft-badge">Ngu?i t?o s?n ph?m</span>
            <h2 className="mt-5 text-3xl font-black text-slate-950">
              Ðu?c xây d?ng t? nh?ng công vi?c giáo viên làm m?i ngày.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              So?n Lab du?c t?o b?i Tr?n Ð?c Duy v?i mong mu?n gi?m th?i gian
              cho nh?ng vi?c l?p l?i nhu so?n d?, chu?n b? phi?u h?c t?p và vi?t
              nh?n xét.
            </p>
            <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-900">
              M?c tiêu không ph?i thay th? giáo viên, mà giúp giáo viên có thêm
              th?i gian cho h?c sinh và ch?t lu?ng bài d?y.
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
              S?n sàng t?o tài li?u d?u tiên v?i So?n Lab?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              M? dashboard, ch?n m?t m?u nhanh ho?c b?t d?u t? công c? quen
              thu?c d? t?o b?n nháp và xu?t Word/PDF.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn-primary">
                M? dashboard
              </Link>
              <Link href="/samples" className="btn-secondary">
                M?u s? d?ng
              </Link>
              <Link href="/tools" className="btn-secondary">
                Xem công c?
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
            {["Môn h?c", "L?p", "Ch? d?"].map((x) => (
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
              {["Word", "PDF", "L?ch s?"].map((x) => (
                <span key={x} className="soft-badge">
                  {x}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {["T?o d?", "Phi?u h?c t?p", "Nh?n xét", "Ma tr?n"].map((x) => (
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
