import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth/user";
import { getMaintenanceBlockForUser } from "@/lib/maintenance";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "tikz-assets";
const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
const MAX_DERIVED_SIZE = 10 * 1024 * 1024;
const assetIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const kinds = new Set(["source", "svg", "png", "pdf"]);
const sourceMimes = new Set(["image/png", "image/jpeg", "image/webp"]);
const derivedMimes: Record<string, string> = { svg: "image/svg+xml", png: "image/png", pdf: "application/pdf" };

function objectPath(userId: string, assetId: string, kind: string) {
  return `${userId}/${assetId}/${kind}.bin`;
}

function containsAssetId(value: unknown, assetId: string): boolean {
  if (value === assetId) return true;
  if (Array.isArray(value)) return value.some((item) => containsAssetId(item, assetId));
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some((item) => containsAssetId(item, assetId));
}

async function authenticatedContext(checkMaintenance = true) {
  const user = await getCurrentUser();
  if (isSupabaseConfigured() && !user) return { response: NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để quản lý ảnh nguồn TikZ." }, { status: 401 }) };
  if (checkMaintenance) {
    const maintenance = await getMaintenanceBlockForUser(user);
    if (maintenance) return { response: NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 }) };
  }
  const supabase = await createSupabaseServerClient();
  if (!user || !supabase) return { response: NextResponse.json({ ok: false, error: "Kho lưu trữ riêng tư chưa được cấu hình." }, { status: 503 }) };
  return { user, supabase };
}

export async function POST(request: Request) {
  try {
    const context = await authenticatedContext();
    if ("response" in context) return context.response;
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "source");
    const requestedId = String(form.get("assetId") || "");
    if (!(file instanceof File) || !kinds.has(kind)) return NextResponse.json({ ok: false, error: "Tệp hình chưa hợp lệ." }, { status: 400 });
    const limit = kind === "source" ? MAX_SOURCE_SIZE : MAX_DERIVED_SIZE;
    if (!file.size || file.size > limit) return NextResponse.json({ ok: false, error: "Tệp hình vượt quá dung lượng cho phép." }, { status: 400 });
    if (kind === "source" ? !sourceMimes.has(file.type) : derivedMimes[kind] !== file.type) return NextResponse.json({ ok: false, error: "Định dạng tệp hình chưa được hỗ trợ." }, { status: 400 });
    if (requestedId && !assetIdPattern.test(requestedId)) return NextResponse.json({ ok: false, error: "Mã tài sản hình chưa hợp lệ." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    let width: number | undefined; let height: number | undefined;
    if (file.type === "image/svg+xml") {
      const svg = buffer.toString("utf8");
      if (!/^\s*<svg\b/i.test(svg) || /<(?:script|foreignObject)\b|(?:href|src)\s*=\s*["'](?:https?:|file:|\/\/)/i.test(svg)) return NextResponse.json({ ok: false, error: "Tệp SVG chứa tài nguyên không được phép." }, { status: 400 });
    }
    if (file.type === "application/pdf" && !buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return NextResponse.json({ ok: false, error: "Tệp PDF chưa hợp lệ." }, { status: 400 });
    if (file.type !== "image/svg+xml" && file.type !== "application/pdf") {
      const metadata = await sharp(buffer, { failOn: "error" }).metadata(); width = metadata.width; height = metadata.height;
      if (!width || !height) return NextResponse.json({ ok: false, error: "Không đọc được kích thước tệp hình." }, { status: 400 });
    }
    const assetId = requestedId || randomUUID();
    const { error } = await context.supabase.storage.from(BUCKET).upload(objectPath(context.user.id, assetId, kind), buffer, { contentType: file.type, upsert: Boolean(requestedId) });
    if (error) throw new Error("private_asset_upload_failed");
    const timestamp = new Date().toISOString();
    return NextResponse.json({ ok: true, asset: { id: assetId, kind, mimeType: file.type, size: buffer.length, hash: createHash("sha256").update(buffer).digest("hex"), width, height, createdAt: timestamp, updatedAt: timestamp } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[tikz-private-asset]", error instanceof Error ? error.message : "unknown_error");
    return NextResponse.json({ ok: false, error: "Chưa lưu được ảnh vào vùng riêng tư. Bản TikZ hiện tại vẫn được giữ." }, { status: 422 });
  }
}

export async function GET(request: Request) {
  try {
    const context = await authenticatedContext(false);
    if ("response" in context) return context.response;
    const url = new URL(request.url); const assetId = url.searchParams.get("id") || ""; const kind = url.searchParams.get("kind") || "source";
    if (!assetIdPattern.test(assetId) || !kinds.has(kind)) return NextResponse.json({ ok: false, error: "Mã tài sản hình chưa hợp lệ." }, { status: 400 });
    const { data, error } = await context.supabase.storage.from(BUCKET).download(objectPath(context.user.id, assetId, kind));
    if (error || !data) return NextResponse.json({ ok: false, error: "Ảnh nguồn không còn được lưu." }, { status: 404 });
    return new NextResponse(await data.arrayBuffer(), { headers: { "Content-Type": data.type || "application/octet-stream", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa tải được ảnh nguồn riêng tư." }, { status: 422 });
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await authenticatedContext();
    if ("response" in context) return context.response;
    const url = new URL(request.url); const assetId = url.searchParams.get("id") || "";
    if (!assetIdPattern.test(assetId)) return NextResponse.json({ ok: false, error: "Mã tài sản hình chưa hợp lệ." }, { status: 400 });
    const { data: documents, error: documentError } = await context.supabase.from("documents").select("id,metadata");
    if (documentError) throw new Error("asset_reference_check_failed");
    const referenced = (documents || []).some((row) => containsAssetId(row.metadata, assetId));
    if (referenced) return NextResponse.json({ ok: false, referenced: true, error: "Hình đang được sử dụng trong tài liệu khác nên chưa thể xóa tài sản." }, { status: 409 });
    const paths = ["source", "svg", "png", "pdf"].map((kind) => objectPath(context.user.id, assetId, kind));
    const { error } = await context.supabase.storage.from(BUCKET).remove(paths);
    if (error) throw new Error("private_asset_delete_failed");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa thể xóa tài sản hình an toàn." }, { status: 422 });
  }
}
