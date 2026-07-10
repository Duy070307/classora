import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeTikzCode, validateTikzImportItem, type TikzImportItem } from "@/lib/tikz-bank/import-validation";

type ImportBody = {
  mode?: unknown;
  duplicateMode?: unknown;
  filename?: unknown;
  version?: unknown;
  items?: unknown;
};

type ExistingRow = { id: string; slug: string | null; title: string; sha256: string | null; tikz_code: string };

function hashCode(code: string) {
  return createHash("sha256").update(normalizeTikzCode(code), "utf8").digest("hex");
}

function friendlyError(status = 500) {
  return NextResponse.json({ success: false, message: "Chưa thể xử lý bộ mã TikZ. Vui lòng kiểm tra tệp và thử lại." }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ success: false, message: "Chỉ quản trị viên mới có thể nhập bộ mã TikZ." }, { status: 403 });
    const body = await request.json().catch(() => null) as ImportBody | null;
    if (!body || !Array.isArray(body.items) || body.items.length > 1000) return friendlyError(400);
    const mode = body.mode === "import" ? "import" : "preview";
    const duplicateMode = body.duplicateMode === "update" ? "update" : "skip";
    const admin = createSupabaseAdminClient();
    if (!admin) return friendlyError(503);

    const { data: existingData, error: existingError } = await admin.from("tikz_bank").select("id,slug,title,sha256,tikz_code").eq("bank_scope", "system");
    if (existingError) return friendlyError();
    const existing = (existingData || []) as ExistingRow[];
    const bySlug = new Map(existing.filter((item) => item.slug).map((item) => [item.slug as string, item]));
    const byHash = new Map(existing.map((item) => [item.sha256 || hashCode(item.tikz_code), item]));
    const byTitle = new Map(existing.map((item) => [item.title.trim().toLowerCase(), item]));

    const seenSlugs = new Set<string>();
    const seenHashes = new Set<string>();
    const seenTitles = new Set<string>();
    const validated = body.items.map((raw, index) => {
      const result = validateTikzImportItem(raw);
      const hash = result.item ? hashCode(result.item.tikz_code) : "";
      const duplicateRow = result.item ? bySlug.get(result.item.slug) || byHash.get(hash) || byTitle.get(result.item.title.toLowerCase()) : undefined;
      const titleKey = result.item?.title.toLowerCase() || "";
      const duplicateWithin = Boolean(result.item && (seenSlugs.has(result.item.slug) || seenHashes.has(hash) || seenTitles.has(titleKey)));
      if (result.item && !duplicateWithin) {
        seenSlugs.add(result.item.slug);
        seenHashes.add(hash);
        seenTitles.add(titleKey);
      }
      return { index, result, hash, duplicateRow, duplicateWithin };
    });

    if (mode === "preview") {
      const rows = validated.map(({ index, result, duplicateRow, duplicateWithin }) => ({
        index,
        title: result.item?.title || `Mục ${index + 1}`,
        subject: result.item?.subject,
        category: result.item?.category,
        grade: result.item?.grade,
        package_dependencies: result.item?.package_dependencies || [],
        tikz_code: result.item?.tikz_code || "",
        validationStatus: result.status,
        message: result.message,
        duplicate: Boolean(duplicateRow || duplicateWithin),
      }));
      return NextResponse.json({
        success: true,
        rows,
        summary: {
          total: rows.length,
          valid: rows.filter((item) => item.validationStatus === "valid").length,
          warning: rows.filter((item) => item.validationStatus === "warning").length,
          invalid: rows.filter((item) => item.validationStatus === "error").length,
          duplicate: rows.filter((item) => item.duplicate).length,
        },
      });
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let invalid = 0;
    for (const entry of validated) {
      if (!entry.result.item || entry.result.status === "error") { invalid += 1; continue; }
      if (entry.duplicateWithin) { skipped += 1; continue; }
      const item = entry.result.item;
      const duplicateRow = entry.duplicateRow;
      if (duplicateRow && duplicateMode === "skip") { skipped += 1; continue; }
      const row = importRow(item, entry.hash, user.id);
      if (duplicateRow) {
        const { error } = await admin.from("tikz_bank").update(row).eq("id", duplicateRow.id).eq("bank_scope", "system");
        if (error) { invalid += 1; continue; }
        updated += 1;
      } else {
        const { error } = await admin.from("tikz_bank").insert(row);
        if (error) { skipped += 1; continue; }
        inserted += 1;
      }
    }

    const filename = typeof body.filename === "string" ? body.filename.slice(0, 255) : "tikz-bank.json";
    const version = typeof body.version === "string" ? body.version.slice(0, 40) : null;
    await admin.from("tikz_imports").insert({
      admin_user_id: user.id,
      filename,
      version,
      total_items: body.items.length,
      inserted_count: inserted,
      updated_count: updated,
      skipped_count: skipped,
      invalid_count: invalid,
    });
    return NextResponse.json({ success: true, inserted, updated, skipped, invalid });
  } catch {
    return friendlyError();
  }
}

function importRow(item: TikzImportItem, sha256: string, adminId: string) {
  return {
    user_id: null,
    bank_scope: "system",
    slug: item.slug,
    title: item.title,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory,
    subject: item.subject,
    grade: item.grade || item.grades[0] || null,
    grades: item.grades,
    tags: item.tags,
    complexity: item.complexity,
    tikz_code: item.tikz_code,
    full_latex: item.full_latex,
    package_dependencies: item.package_dependencies,
    source_name: item.source_name,
    source_url: item.source_url,
    source_author: item.source_author,
    source_license: item.source_license,
    originality_mode: item.originality_mode,
    preview_note: item.preview_note,
    source_type: "file_import",
    needs_review: item.needs_review,
    sha256,
    imported_by: adminId,
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: item.metadata,
  };
}
