import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { BetaRequestsAdmin, type BetaRequestRow } from "@/components/admin/BetaRequestsAdmin";
import { requireAdmin } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminBetaRequestsPage() {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = admin
    ? await admin.from("beta_requests").select("id,created_at,full_name,email,phone,subject,teaching_level,school,purpose,note,status,admin_note,approved_at").order("created_at", { ascending: false }).limit(200)
    : { data: null, error: null };

  return (
    <AppShell title="Đăng ký dùng thử">
      <PageHeader title="Yêu cầu đăng ký dùng thử" description="Xem xét nhu cầu của giáo viên và quản lý danh sách cấp tài khoản thử nghiệm." />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin" className="btn-secondary">Quay lại quản trị</Link>
      </div>

      <BetaRequestsAdmin initialRequests={(data || []) as BetaRequestRow[]} loadError={!admin || Boolean(error)} />

      <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <span className="font-black">Sau khi duyệt: </span>
        quản trị viên có thể tạo tài khoản trong hệ thống quản lý tài khoản và gửi thông tin đăng nhập cho giáo viên. Việc duyệt tại đây chưa tự động tạo tài khoản.
      </section>
    </AppShell>
  );
}
