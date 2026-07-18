"use client";

import { useEffect, useState } from "react";
import { Save, Wrench } from "lucide-react";
import { DEFAULT_MAINTENANCE_MESSAGE, type MaintenanceSettings } from "@/lib/maintenance-shared";

type ApiResult = { ok?: boolean; maintenance?: MaintenanceSettings; error?: string };

export function MaintenanceAdminPanel() {
  const [settings, setSettings] = useState<MaintenanceSettings>({ enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE });
  const [savedEnabled, setSavedEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/maintenance", { cache: "no-store" })
      .then(async (response) => ({ response, data: await response.json().catch(() => null) as ApiResult | null }))
      .then(({ response, data }) => {
        if (!active) return;
        if (response.ok && data?.maintenance) {
          setSettings(data.maintenance);
          setSavedEnabled(data.maintenance.enabled);
        }
        else setNotice({ type: "error", text: data?.error || "Không thể tải trạng thái bảo trì." });
      })
      .catch(() => { if (active) setNotice({ type: "error", text: "Không thể tải trạng thái bảo trì." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save() {
    if (settings.enabled && !savedEnabled && !window.confirm("Bật chế độ bảo trì sẽ tạm dừng quyền dùng công cụ của giáo viên. Tiếp tục lưu thay đổi?")) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: settings.enabled, message: settings.message }),
      });
      const data = await response.json().catch(() => null) as ApiResult | null;
      if (!response.ok || !data?.maintenance) throw new Error(data?.error || "update_failed");
      setSettings(data.maintenance);
      setSavedEnabled(data.maintenance.enabled);
      setNotice({ type: "success", text: "Đã cập nhật chế độ bảo trì." });
    } catch {
      setNotice({ type: "error", text: "Không thể cập nhật chế độ bảo trì. Vui lòng thử lại." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ui-panel mt-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Wrench size={20} /></span>
          <div>
            <h2 className="text-lg font-black text-slate-950">Chế độ bảo trì</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Khi bật, tài khoản giáo viên đã được cấp sẽ tạm thời không dùng được công cụ. Admin vẫn truy cập bình thường. Trang đăng nhập và đăng ký dùng thử vẫn hoạt động.</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${settings.enabled ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{settings.enabled ? "Đang bật" : "Đang tắt"}</span>
      </div>

      <div className="mt-5 space-y-4">
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-900">Giáo viên sẽ được chuyển đến trang bảo trì ở lần tải trang hoặc gọi API tiếp theo.</p>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <span className="font-bold text-slate-900">Bật chế độ bảo trì</span>
          <input type="checkbox" className="h-5 w-5 accent-emerald-700" checked={settings.enabled} disabled={loading || saving} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-800">Thông báo hiển thị cho giáo viên</span>
          <textarea className="form-field mt-2 min-h-28 resize-y" maxLength={600} disabled={loading || saving} value={settings.message} onChange={(event) => setSettings((current) => ({ ...current, message: event.target.value }))} />
          <span className="mt-1 block text-right text-xs text-slate-400">{settings.message.length}/600</span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" disabled={loading || saving} onClick={() => { void save(); }}><Save size={17} />{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
        {notice ? <p role={notice.type === "error" ? "alert" : "status"} aria-live="polite" className={`text-sm font-bold ${notice.type === "success" ? "text-emerald-700" : "text-red-700"}`}>{notice.text}</p> : null}
      </div>
    </section>
  );
}
