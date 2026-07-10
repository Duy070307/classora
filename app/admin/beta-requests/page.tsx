import Link from "next/link";
import { CheckCircle2, Clock3, Mail, UserCheck, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth/require-user";
import { isBetaRequestStatus, type BetaRequestStatus } from "@/lib/beta-requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BetaRequestRow = {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  teaching_level: string;
  school: string | null;
  purpose: string;
  note: string | null;
  status: BetaRequestStatus;
  admin_note: string | null;
  approved_at: string | null;
};

const statusLabels: Record<BetaRequestStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

export default async function AdminBetaRequestsPage() {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = admin
    ? await admin.from("beta_requests").select("id,created_at,full_name,email,phone,subject,teaching_level,school,purpose,note,status,admin_note,approved_at").order("created_at", { ascending: false }).limit(200)
    : { data: null, error: null };
  const requests = (data || []) as BetaRequestRow[];
  const counts = requests.reduce((result, item) => ({ ...result, [item.status]: result[item.status] + 1 }), { pending: 0, approved: 0, rejected: 0 });

  async function updateRequest(formData: FormData) {
    "use server";
    const user = await requireAdmin();
    const id = String(formData.get("id") || "");
    const status = formData.get("status");
    const adminNote = String(formData.get("adminNote") || "").trim().slice(0, 2000);
    if (!id || !isBetaRequestStatus(status)) return;
    const client = createSupabaseAdminClient();
    if (!client) return;
    const { data: current } = await client.from("beta_requests").select("status,approved_at,approved_by").eq("id", id).maybeSingle();
    const alreadyApproved = current?.status === "approved";
    await client.from("beta_requests").update({
      status,
      admin_note: adminNote || null,
      approved_at: status === "approved" ? (alreadyApproved ? current.approved_at : new Date().toISOString()) : null,
      approved_by: status === "approved" ? (alreadyApproved ? current.approved_by : user.id) : null,
    }).eq("id", id);
    revalidatePath("/admin/beta-requests");
  }

  return (
    <AppShell title="Đăng ký dùng thử">
      <PageHeader title="Yêu cầu đăng ký dùng thử" description="Xem xét nhu cầu của giáo viên và quản lý danh sách cấp tài khoản thử nghiệm." />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin" className="btn-secondary">Quay lại quản trị</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Mail} label="Tổng yêu cầu" value={requests.length} tone="blue" />
        <Stat icon={Clock3} label="Chờ duyệt" value={counts.pending} tone="amber" />
        <Stat icon={CheckCircle2} label="Đã duyệt" value={counts.approved} tone="emerald" />
        <Stat icon={XCircle} label="Từ chối" value={counts.rejected} tone="slate" />
      </section>

      <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <span className="font-black">Sau khi duyệt: </span>
        admin có thể tạo tài khoản trong Supabase Auth và gửi thông tin đăng nhập cho giáo viên. Việc duyệt tại đây chưa tự động tạo tài khoản.
      </section>

      <div className="mt-6">
        {!admin ? (
          <Empty text="Chưa thể xem yêu cầu đăng ký trong môi trường hiện tại." />
        ) : error ? (
          <Empty text="Chưa tải được danh sách đăng ký. Vui lòng kiểm tra migration cơ sở dữ liệu." />
        ) : requests.length ? (
          <div className="grid gap-4">
            {requests.map((item) => (
              <article key={item.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950">{item.full_name}</h2>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 break-all text-sm font-bold text-blue-700">{item.email}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Gửi lúc {new Date(item.created_at).toLocaleString("vi-VN")}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="font-black text-slate-900">{item.subject}</p>
                    <p className="mt-1 text-slate-600">{item.teaching_level}</p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Số điện thoại/Zalo" value={item.phone || "Không cung cấp"} />
                  <Info label="Trường/đơn vị" value={item.school || "Không cung cấp"} />
                </dl>
                <InfoBlock label="Mục đích sử dụng" value={item.purpose} />
                {item.note ? <InfoBlock label="Ghi chú của giáo viên" value={item.note} /> : null}

                <form action={updateRequest} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="block text-sm font-bold text-slate-900">
                    Ghi chú quản trị
                    <textarea name="adminNote" defaultValue={item.admin_note || ""} maxLength={2000} className="form-field mt-2 min-h-20 resize-y bg-white" placeholder="Ghi chú liên hệ, ưu tiên hoặc lý do xử lý..." />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button name="status" value="approved" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 size={16} />Đánh dấu đã duyệt</button>
                    <button name="status" value="rejected" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"><XCircle size={16} />Đánh dấu từ chối</button>
                    <button name="status" value={item.status} className="btn-secondary min-h-10">Lưu ghi chú</button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <Empty text="Chưa có yêu cầu đăng ký dùng thử nào." />
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Mail; label: string; value: number; tone: "blue" | "amber" | "emerald" | "slate" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-700" };
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon size={19} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>;
}

function StatusBadge({ status }: { status: BetaRequestStatus }) {
  const colors = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${colors[status]}`}>{statusLabels[status]}</span>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value}</dd></div>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return <div className="mt-3 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{value}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="empty-state"><UserCheck className="mx-auto text-blue-600" size={34} /><p className="mt-3 font-bold text-slate-900">{text}</p></div>;
}
