import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, ServerCog } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getProviderStatus } from "@/lib/ai/provider";
import { isRegistrationEnabled, isSupabaseConfigured } from "@/lib/supabase/is-configured";

const items = [
  ["Tạo đề kiểm tra", "Hoạt động", "active"],
  ["Xuất Word", "Hoạt động", "active"],
  ["Print/PDF", "Hoạt động", "active"],
  ["Mẫu sử dụng", "Hoạt động", "active"],
  ["Lưu lịch sử", "Hoạt động", "active"],
  ["Tài khoản", "Hoạt động nếu Supabase được cấu hình", "active"],
  ["Đồng bộ dữ liệu", "Hoạt động nếu Supabase được cấu hình", "active"],
  ["OCR ảnh/PDF", "Chưa mở", "upcoming"],
] as const;

export const metadata: Metadata = {
  title: { absolute: "Trạng thái hệ thống - Soạn Lab" },
  description: "Theo dõi các chức năng đang hoạt động của Soạn Lab như tạo đề kiểm tra, xuất Word, Print/PDF, mẫu sử dụng và lưu lịch sử.",
};

export default function SystemStatusPage() {
  const ai = getProviderStatus();
  const supabaseConfigured = isSupabaseConfigured();
  const registrationEnabled = isRegistrationEnabled();
  return (
    <main className="warm-page min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Trạng thái hệ thống</p>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">Các chức năng chính của Soạn Lab</h1>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Trang này giúp giáo viên biết nhanh chức năng nào đang dùng được và chức năng nào chưa mở. Nội dung tạo ra là bản nháp và cần giáo viên rà soát trước khi sử dụng.
          </p>
        </div>

        <section className="card mt-8 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ServerCog size={20} />
            </span>
            <div>
              <h2 className="font-extrabold text-ink">Chế độ tạo nội dung</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Soạn Lab tạo nội dung qua máy chủ khi provider được cấu hình. Nếu thiếu key hoặc provider lỗi, hệ thống tự dùng chế độ cục bộ để không làm gián đoạn quy trình.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Nhà cung cấp đang dùng</dt><dd className="mt-1 font-extrabold text-ink">{ai.active}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Cấu hình yêu cầu</dt><dd className="mt-1 font-extrabold text-ink">{ai.requested}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">OpenAI key</dt><dd className="mt-1 font-extrabold text-ink">{ai.openaiKeyConfigured ? "Đã cấu hình" : "Chưa cấu hình"}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Gemini key</dt><dd className="mt-1 font-extrabold text-ink">{ai.geminiKeyConfigured ? "Đã cấu hình" : "Chưa cấu hình"}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Giới hạn ngày</dt><dd className="mt-1 font-extrabold text-ink">{ai.dailyLimit} lượt/trình duyệt</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Giới hạn output</dt><dd className="mt-1 font-extrabold text-ink">{ai.maxOutputTokens} tokens</dd></div>
          </dl>
        </section>

        <section className="card mt-8 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <ServerCog size={20} />
            </span>
            <div>
              <h2 className="font-extrabold text-ink">Tài khoản và dữ liệu</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Khi Supabase được cấu hình, Soạn Lab dùng tài khoản cloud và lưu dữ liệu theo từng giáo viên. Nếu chưa cấu hình, ứng dụng tiếp tục dùng dữ liệu cục bộ trên trình duyệt.
              </p>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Supabase</dt><dd className="mt-1 font-extrabold text-ink">{supabaseConfigured ? "Đã cấu hình" : "Chưa cấu hình"}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Chế độ tài khoản</dt><dd className="mt-1 font-extrabold text-ink">{supabaseConfigured ? "Cloud account" : "Local browser mode"}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Đăng ký</dt><dd className="mt-1 font-extrabold text-ink">{registrationEnabled ? "Đang mở" : "Đang khóa"}</dd></div>
            <div className="rounded-2xl bg-slate-50 p-4"><dt className="text-muted">Database</dt><dd className="mt-1 font-extrabold text-ink">{supabaseConfigured ? "Supabase" : "Trình duyệt"}</dd></div>
          </dl>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map(([name, status, type]) => {
            const active = type === "active";
            return (
              <article key={name} className="card flex items-center justify-between gap-4 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {active ? <CheckCircle2 size={20} /> : <Clock3 size={20} />}
                  </span>
                  <div>
                    <h2 className="font-extrabold text-ink">{name}</h2>
                    <p className="text-sm text-muted">{active ? "Có thể sử dụng trong ứng dụng hiện tại." : "Sẽ được mở khi hạ tầng phù hợp hoàn thiện."}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {status}
                </span>
              </article>
            );
          })}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/dashboard" className="btn-primary">Bắt đầu sử dụng</Link>
          <Link href="/samples" className="btn-secondary">Mẫu sử dụng</Link>
          <Link href="/tools" className="btn-secondary">Xem công cụ</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
