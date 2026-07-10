import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isBetaRequestStatus } from "@/lib/beta-requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const genericMessage = "Chưa cập nhật được yêu cầu. Vui lòng thử lại.";
const selectFields = "id,created_at,full_name,email,phone,subject,teaching_level,school,purpose,note,status,admin_note,approved_at";

type PatchBody = {
  status?: unknown;
  admin_note?: unknown;
};

function failure(message = genericMessage, status = 500) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return failure("Vui lòng đăng nhập.", 401);
    if (user.role !== "admin") return failure("Thầy/cô không có quyền thực hiện thao tác này.", 403);

    const { id } = await context.params;
    if (!uuidPattern.test(id)) return failure("Yêu cầu cần cập nhật chưa hợp lệ.", 400);

    let body: PatchBody;
    try {
      body = await request.json() as PatchBody;
    } catch {
      return failure("Thông tin cập nhật chưa hợp lệ.", 400);
    }

    const hasStatus = body.status !== undefined;
    const hasAdminNote = body.admin_note !== undefined;
    if (!hasStatus && !hasAdminNote) return failure("Chưa có thông tin cần cập nhật.", 400);
    if (hasStatus && !isBetaRequestStatus(body.status)) return failure("Trạng thái cập nhật chưa hợp lệ.", 400);
    if (hasAdminNote && typeof body.admin_note !== "string") return failure("Ghi chú quản trị chưa hợp lệ.", 400);

    const adminNote = typeof body.admin_note === "string" ? body.admin_note.trim() : undefined;
    if (adminNote && adminNote.length > 2000) return failure("Ghi chú quản trị không được dài quá 2000 ký tự.", 400);

    const admin = createSupabaseAdminClient();
    if (!admin) return failure(genericMessage, 503);

    const changes: Record<string, string | null> = { updated_at: new Date().toISOString() };
    if (hasAdminNote) changes.admin_note = adminNote || null;
    if (hasStatus && isBetaRequestStatus(body.status)) {
      changes.status = body.status;
      if (body.status === "approved") {
        changes.approved_at = new Date().toISOString();
        changes.approved_by = user.id;
      } else {
        changes.approved_at = null;
        changes.approved_by = null;
      }
    }

    let result = await admin.from("beta_requests").update(changes).eq("id", id).select(selectFields).maybeSingle();

    // Cho phép thao tác tiếp tục an toàn trong lúc cột updated_at đang được đồng bộ khi triển khai.
    if (result.error && ["42703", "PGRST204"].includes(result.error.code || "")) {
      delete changes.updated_at;
      result = await admin.from("beta_requests").update(changes).eq("id", id).select(selectFields).maybeSingle();
    }

    if (result.error) return failure();
    if (!result.data) return failure("Không tìm thấy yêu cầu cần cập nhật.", 404);

    return NextResponse.json({ success: true, request: result.data });
  } catch {
    return failure();
  }
}
