import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTikzBankSeeds } from "@/lib/tikz-bank/seed";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập." }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ ok: false, error: "Chỉ quản trị viên mới có thể thêm mã TikZ mẫu." }, { status: 403 });
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false, error: "Chưa thể thêm mã TikZ mẫu lúc này." }, { status: 503 });
    const seeds = getTikzBankSeeds();
    const { data: existing, error: existingError } = await admin.from("tikz_bank").select("title").eq("bank_scope", "system");
    if (existingError) return NextResponse.json({ ok: false, error: "Chưa thể kiểm tra mã TikZ mẫu lúc này." }, { status: 500 });
    const titles = new Set((existing || []).map((item) => String(item.title).trim().toLowerCase()));
    const rows = seeds.filter((item) => !titles.has(item.title.toLowerCase())).map((item) => ({
      ...item,
      user_id: null,
      bank_scope: "system",
      full_latex: null,
      preview_note: "Mã tham khảo cần kiểm tra lại khi biên dịch LaTeX.",
      source_type: "Soạn Lab seed",
      needs_review: true,
    }));
    if (rows.length) {
      const { error } = await admin.from("tikz_bank").insert(rows);
      if (error) return NextResponse.json({ ok: false, error: "Chưa thể thêm mã TikZ mẫu lúc này." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, inserted: rows.length, skipped: seeds.length - rows.length });
  } catch {
    return NextResponse.json({ ok: false, error: "Chưa thể thêm mã TikZ mẫu lúc này." }, { status: 500 });
  }
}
