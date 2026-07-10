import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FeedbackRow = {
  id: string;
  created_at: string;
  user_email: string | null;
  category: string;
  tool: string;
  rating: number | null;
  message: string;
  contact: string | null;
  path: string | null;
  status: string | null;
};

const statusLabels: Record<string, string> = {
  new: "Mới",
  reviewing: "Đang xem",
  resolved: "Đã xử lý",
  ignored: "Bỏ qua",
};

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const admin = createSupabaseAdminClient();
  const { data, error } = admin
    ? await admin
        .from("feedback")
        .select("id,created_at,user_email,category,tool,rating,message,contact,path,status")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: null, error: null };
  const feedback = (data || []) as FeedbackRow[];

  return (
    <AppShell title="Góp ý giáo viên">
      <PageHeader title="Góp ý từ giáo viên" description="Theo dõi phản hồi trong giai đoạn thầy cô dùng thử Soạn Lab." />
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin" className="btn-secondary">Quay lại quản trị</Link>
      </div>

      {!admin ? (
        <Empty text="Chưa thể xem góp ý trong môi trường hiện tại." />
      ) : error ? (
        <Empty text="Chưa tải được danh sách góp ý. Vui lòng kiểm tra lại sau." />
      ) : feedback.length ? (
        <section className="grid gap-4">
          {feedback.map((item) => (
            <article key={item.id} className="rounded-[26px] border border-blue-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{item.category}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item.tool || "Khác"}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{statusLabels[item.status || "new"] || "Mới"}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    {new Date(item.created_at).toLocaleString("vi-VN")} · {item.user_email || "Không rõ email"}
                  </p>
                </div>
                {item.rating ? (
                  <div className="rounded-2xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">{item.rating}/5</div>
                ) : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">{item.message}</p>
              <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <Info label="Liên hệ" value={item.contact || "Không có"} />
                <Info label="Trang" value={item.path || "Không rõ"} />
              </dl>
            </article>
          ))}
        </section>
      ) : (
        <Empty text="Chưa có góp ý nào từ giáo viên." />
      )}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <section className="empty-state">
      <MessageCircle className="mx-auto text-blue-600" size={34} />
      <p className="mt-3 font-bold text-slate-900">{text}</p>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
