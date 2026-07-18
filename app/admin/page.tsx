import Link from "next/link";
import { FileText, LockKeyhole, Shield, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isRegistrationEnabled, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { MaintenanceAdminPanel } from "@/components/admin/MaintenanceAdminPanel";
import { isMaintenanceBypassed } from "@/lib/maintenance";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!isSupabaseConfigured()) {
    return (
      <AppShell title="Quản trị">
        <PageHeader title="Quản trị Soạn Lab" description="Khu vực quản trị chưa sẵn sàng trong môi trường hiện tại." />
      </AppShell>
    );
  }

  if (!user || !isMaintenanceBypassed(user)) {
    return (
      <AppShell title="Quản trị">
        <PageHeader title="Không có quyền truy cập" description="Khu vực này chỉ dành cho quản trị viên." />
        <Link href="/dashboard" className="btn-primary">Về dashboard</Link>
      </AppShell>
    );
  }

  const admin = createSupabaseAdminClient();
  const [users, documents, templates, questions, systemQuestions, teacherQuestions, betaRequests] = admin
    ? await Promise.all([
        admin.auth.admin.listUsers({ page: 1, perPage: 20 }),
        admin.from("documents").select("id", { count: "exact", head: true }),
        admin.from("templates").select("id", { count: "exact", head: true }),
        admin.from("question_bank").select("id", { count: "exact", head: true }),
        admin.from("question_bank").select("id", { count: "exact", head: true }).eq("bank_scope", "system"),
        admin.from("question_bank").select("id", { count: "exact", head: true }).eq("bank_scope", "user"),
        admin.from("beta_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ])
    : [null, null, null, null, null, null, null] as const;

  const userCount = users && "data" in users ? users.data.users.length : 0;

  return (
    <AppShell title="Quản trị">
      <PageHeader
        eyebrow="Quản trị Soạn Lab"
        title="Tổng quan vận hành"
        description="Theo dõi tài khoản, tài liệu đã lưu và trạng thái đăng ký ở mức cần thiết cho quản trị viên."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Users} label="Tài khoản gần đây" value={String(userCount)} />
        <StatCard icon={FileText} label="Tài liệu đã lưu" value={String(documents?.count ?? "—")} />
        <StatCard icon={Shield} label="Quyền quản trị" value={isSupabaseAdminConfigured() ? "Sẵn sàng" : "Chưa sẵn sàng"} />
        <StatCard icon={LockKeyhole} label="Đăng ký" value={isRegistrationEnabled() ? "Đang mở" : "Đang khóa"} />
        <StatCard icon={UserPlus} label="Yêu cầu chờ duyệt" value={String(betaRequests?.count ?? "—")} />
      </div>

      <MaintenanceAdminPanel />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="ui-panel p-5">
          <h2 className="text-lg font-black text-slate-900">Tài khoản gần đây</h2>
          {users && "data" in users ? (
            <div className="mt-4 space-y-2">
              {users.data.users.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <p className="font-bold text-slate-900">{item.email}</p>
                  <p className="text-slate-500">Tạo lúc {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "không rõ"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-slate-600">Chức năng xem danh sách tài khoản chưa sẵn sàng trong môi trường hiện tại.</p>
          )}
        </section>

        <section className="ui-panel p-5">
          <h2 className="text-lg font-black text-slate-900">Dữ liệu đã lưu</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tài liệu" value={documents?.count ?? "—"} />
            <Row label="Mẫu cá nhân" value={templates?.count ?? "—"} />
            <Row label="Ngân hàng câu hỏi" value={questions?.count ?? "—"} />
            <Row label="Câu hỏi Soạn Lab" value={systemQuestions?.count ?? "—"} />
            <Row label="Câu hỏi giáo viên" value={teacherQuestions?.count ?? "—"} />
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
            <Link href="/tools" className="btn-secondary">Công cụ</Link>
            <Link href="/admin/beta-requests" className="btn-secondary">Đăng ký dùng thử</Link>
            <Link href="/admin/feedback" className="btn-secondary">Góp ý giáo viên</Link>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-950">
        <p>
          <span className="font-black">Gợi ý khi mời giáo viên dùng thử: </span>
          Sau khi gửi link test, quản trị viên có thể theo dõi phản hồi tại mục Góp ý giáo viên để ưu tiên sửa những điểm ảnh hưởng nhiều nhất tới trải nghiệm.
        </p>
      </section>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="ui-panel p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon size={20} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-black text-slate-900">{value}</dd>
    </div>
  );
}
