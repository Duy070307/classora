"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Mail, UserCheck, XCircle } from "lucide-react";
import { isBetaRequestStatus, type BetaRequestStatus } from "@/lib/beta-requests";

export type BetaRequestRow = {
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

export function BetaRequestsAdmin({ initialRequests, loadError = false }: { initialRequests: BetaRequestRow[]; loadError?: boolean }) {
  const [requests, setRequests] = useState(initialRequests);
  const [notes, setNotes] = useState<Record<string, string>>(() => Object.fromEntries(initialRequests.map((item) => [item.id, item.admin_note || ""])));
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const counts = useMemo(() => requests.reduce((result, item) => {
    if (isBetaRequestStatus(item.status)) result[item.status] += 1;
    return result;
  }, { pending: 0, approved: 0, rejected: 0 }), [requests]);

  async function updateRequest(item: BetaRequestRow, status?: BetaRequestStatus) {
    if (updatingId) return;
    setUpdatingId(item.id);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/beta-requests/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(status ? { status } : { admin_note: notes[item.id] || "" }),
      });
      const result = await response.json().catch(() => null) as {
        success?: boolean;
        message?: string;
        request?: unknown;
      } | null;
      if (!response.ok || !result?.success || !isSafeRequestUpdate(result.request, item.id)) {
        setNotice({ tone: "error", text: result?.message || "Chưa cập nhật được yêu cầu. Vui lòng thử lại." });
        return;
      }
      const updatedRequest = result.request;
      setRequests((current) => current.map((requestItem) => requestItem.id === item.id ? {
        ...requestItem,
        status: updatedRequest.status,
        admin_note: updatedRequest.admin_note,
        approved_at: updatedRequest.approved_at,
      } : requestItem));
      if (!status) setNotes((current) => ({ ...current, [item.id]: updatedRequest.admin_note || "" }));
      setNotice({
        tone: "success",
        text: status === "approved"
          ? "Đã đánh dấu yêu cầu là đã duyệt."
          : status === "rejected"
            ? "Đã đánh dấu yêu cầu là từ chối."
            : status === "pending"
              ? "Đã chuyển yêu cầu về trạng thái chờ duyệt."
              : "Đã lưu ghi chú.",
      });
    } catch {
      setNotice({ tone: "error", text: "Chưa cập nhật được yêu cầu. Vui lòng thử lại." });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Mail} label="Tổng yêu cầu" value={requests.length} tone="blue" />
        <Stat icon={Clock3} label="Chờ duyệt" value={counts.pending} tone="amber" />
        <Stat icon={CheckCircle2} label="Đã duyệt" value={counts.approved} tone="emerald" />
        <Stat icon={XCircle} label="Từ chối" value={counts.rejected} tone="slate" />
      </section>

      {notice ? (
        <div className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${notice.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`} role="status" aria-live="polite">
          {notice.text}
        </div>
      ) : null}

      <div className="mt-6">
        {loadError ? (
          <Empty text="Chưa tải được danh sách đăng ký. Vui lòng thử lại sau." />
        ) : requests.length ? (
          <div className="grid gap-4">
            {requests.map((item) => {
              const updating = updatingId === item.id;
              return (
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

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-bold text-slate-900">
                      Ghi chú quản trị
                      <textarea value={notes[item.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} className="form-field mt-2 min-h-20 resize-y bg-white" placeholder="Ghi chú liên hệ, ưu tiên hoặc lý do xử lý..." />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={Boolean(updatingId)} onClick={() => { void updateRequest(item, "approved"); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle2 size={16} />{updating ? "Đang cập nhật..." : "Đánh dấu đã duyệt"}</button>
                      <button type="button" disabled={Boolean(updatingId)} onClick={() => { void updateRequest(item, "rejected"); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"><XCircle size={16} />Đánh dấu từ chối</button>
                      <button type="button" disabled={Boolean(updatingId)} onClick={() => { void updateRequest(item); }} className="btn-secondary min-h-10 disabled:cursor-not-allowed disabled:opacity-60">Lưu ghi chú</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty text="Chưa có yêu cầu đăng ký dùng thử nào." />
        )}
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Mail; label: string; value: number; tone: "blue" | "amber" | "emerald" | "slate" }) {
  const colors = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", slate: "bg-slate-100 text-slate-700" };
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tone]}`}><Icon size={19} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>;
}

function StatusBadge({ status }: { status: BetaRequestStatus }) {
  const colors = { pending: "bg-amber-50 text-amber-700", approved: "bg-emerald-50 text-emerald-700", rejected: "bg-slate-100 text-slate-600" };
  const safeStatus = isBetaRequestStatus(status) ? status : "pending";
  return <span className={`rounded-full px-3 py-1 text-xs font-black ${colors[safeStatus]}`}>{statusLabels[safeStatus]}</span>;
}

function isSafeRequestUpdate(value: unknown, expectedId: string): value is Pick<BetaRequestRow, "id" | "status" | "admin_note" | "approved_at"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.id === expectedId
    && isBetaRequestStatus(record.status)
    && (record.admin_note === null || typeof record.admin_note === "string")
    && (record.approved_at === null || typeof record.approved_at === "string");
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
