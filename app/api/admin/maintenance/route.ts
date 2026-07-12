import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceSettings, setMaintenanceSettings } from "@/lib/maintenance";
import { validateMaintenanceUpdate } from "@/lib/maintenance-shared";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (user.role !== "admin") return { error: NextResponse.json({ ok: false, error: "Bạn không có quyền thực hiện thao tác này." }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const maintenance = await getMaintenanceSettings();
  return NextResponse.json({ ok: true, maintenance });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const validated = validateMaintenanceUpdate(await request.json());
    if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
    const maintenance = await setMaintenanceSettings({ enabled: validated.enabled, message: validated.message }, auth.user);
    return NextResponse.json({ ok: true, maintenance });
  } catch {
    return NextResponse.json({ ok: false, error: "Không thể cập nhật chế độ bảo trì. Vui lòng thử lại." }, { status: 500 });
  }
}
