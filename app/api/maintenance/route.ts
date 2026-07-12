import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const maintenance = await getMaintenanceBlockForUser(user);
  return NextResponse.json({
    ok: true,
    maintenance: Boolean(maintenance),
    message: maintenance?.message,
  }, { headers: { "Cache-Control": "no-store" } });
}
