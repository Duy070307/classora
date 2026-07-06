import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRegistrationEnabled, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/is-configured";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Quản trị">
        <PageHeader title="Quản trị hệ thống" description="Khu vực quản trị chưa sẵn sàng trong môi trường hiện tại." />
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
      <PageHeader title="Quản trị Soạn Lab" description="Theo dõi tài khoản, tài liệu đã lưu và một số thiết lập vận hành." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-muted">Tài khoản</p><p className="mt-1 font-extrabold text-ink">{isSupabaseConfigured() ? "Đang hoạt động" : "Chưa sẵn sàng"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Quyền quản trị</p><p className="mt-1 font-extrabold text-ink">{isSupabaseAdminConfigured() ? "Đang hoạt động" : "Chưa sẵn sàng"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Đăng ký</p><p className="mt-1 font-extrabold text-ink">{isRegistrationEnabled() ? "Đang mở" : "Đang khóa"}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Tạo nội dung</p><p className="mt-1 font-extrabold text-ink">Đang hoạt động</p></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-extrabold text-ink">Dữ liệu đã lưu</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted">Tài liệu đã lưu</dt><dd className="font-bold text-ink">{documents?.count ?? "Chưa sẵn sàng"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Mẫu cá nhân</dt><dd className="font-bold text-ink">{templates?.count ?? "Chưa sẵn sàng"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Ngân hàng câu hỏi</dt><dd className="font-bold text-ink">{questions?.count ?? "Chưa sẵn sàng"}</dd></div>
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
            <p className="mt-3 text-sm leading-6 text-muted">Chức năng xem danh sách tài khoản chưa sẵn sàng trong môi trường hiện tại.</p>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-extrabold text-ink">Ghi chú vận hành</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Tạo tài khoản giáo viên và quản trị viên bằng công cụ quản trị tài khoản, sau đó gán quyền quản trị cho tài khoản phù hợp.
        </p>
      </section>
    </AppShell>
  );
}
