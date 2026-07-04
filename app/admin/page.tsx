import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/user";
import { getProviderStatus } from "@/lib/ai/provider";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRegistrationEnabled, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/is-configured";

export default async function AdminPage() {
  const user = await getCurrentUser();
  const ai = getProviderStatus();

  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Quản trị">
        <PageHeader title="Quản trị hệ thống" description="Supabase chưa được cấu hình. Soạn Lab đang chạy ở chế độ dữ liệu cục bộ trên trình duyệt." />
      </AppShell>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <AppShell title="Quản trị">
        <PageHeader title="Không có quyền truy cập" description="Khu vực này chỉ dành cho quản trị viên." />
        <Link href="/dashboard" className="btn-primary">Về dashboard</Link>
      </AppShell>
    );
  }

  const admin = createSupabaseAdminClient();
  const [users, documents, templates, questions] = admin
    ? await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 20 }),
        admin.from("documents").select("id", { count: "exact", head: true }),
        admin.from("templates").select("id", { count: "exact", head: true }),
        admin.from("question_bank").select("id", { count: "exact", head: true })
      ])
    : [null, null, null, null] as const;

  return (
    <AppShell title="Quản trị">
      <PageHeader title="Quản trị Soạn Lab" description="Theo dõi tài khoản, dữ liệu cloud và cấu hình tạo nội dung." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-muted">Supabase</p><p className="mt-1 font-extrabold text-ink">{isSupabaseConfigured() ? "Đã cấu hình" : "Chưa cấu hình"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Service role</p><p className="mt-1 font-extrabold text-ink">{isSupabaseAdminConfigured() ? "Đã cấu hình" : "Chưa cấu hình"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Đăng ký</p><p className="mt-1 font-extrabold text-ink">{isRegistrationEnabled() ? "Đang mở" : "Đang khóa"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">AI provider</p><p className="mt-1 font-extrabold text-ink">{ai.active}</p></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-ink">Dữ liệu cloud</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Tài liệu đã lưu</dt><dd className="font-bold text-ink">{documents?.count ?? "Cần service role"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Mẫu cá nhân</dt><dd className="font-bold text-ink">{templates?.count ?? "Cần service role"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Ngân hàng câu hỏi</dt><dd className="font-bold text-ink">{questions?.count ?? "Cần service role"}</dd></div>
          </dl>
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-ink">Tài khoản gần đây</h2>
          {users && "data" in users ? (
            <div className="mt-4 space-y-2">
              {users.data.users.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-ink">{item.email}</p>
                  <p className="text-muted">Tạo lúc {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "không rõ"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">Thêm SUPABASE_SERVICE_ROLE_KEY trong biến môi trường Vercel để quản trị viên xem danh sách tài khoản. Không dùng key này ở frontend.</p>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-extrabold text-ink">Ghi chú vận hành</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tạo tài khoản giáo viên và quản trị viên trong Supabase Auth Dashboard, sau đó đặt role admin trong bảng profiles cho tài khoản quản trị.
        </p>
      </section>
    </AppShell>
  );
}
