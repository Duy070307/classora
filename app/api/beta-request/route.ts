import { NextRequest, NextResponse } from "next/server";
import { validateBetaRequest } from "@/lib/beta-requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 4;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "Thầy/cô đã gửi nhiều lần trong thời gian ngắn. Vui lòng thử lại sau ít phút." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Thông tin đăng ký chưa hợp lệ." }, { status: 400 });
  }

  const validated = validateBetaRequest(body);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const supabase = admin || await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Chưa thể nhận đăng ký lúc này. Thầy/cô vui lòng thử lại sau." },
      { status: 503 },
    );
  }

  if (admin) {
    const { data: existing } = await admin
      .from("beta_requests")
      .select("id")
      .ilike("email", validated.data.email)
      .maybeSingle();
    if (existing) return duplicateResponse();
  }

  const { data } = validated;
  const { error } = await supabase.from("beta_requests").insert({
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    subject: data.subject,
    teaching_level: data.teachingLevel,
    school: data.school || null,
    purpose: data.purpose,
    note: data.note || null,
    status: "pending",
  });

  if (error?.code === "23505") return duplicateResponse();
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Chưa thể gửi đăng ký lúc này. Thầy/cô vui lòng thử lại sau." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

function duplicateResponse() {
  return NextResponse.json({
    ok: true,
    duplicate: true,
    message: "Email này đã gửi đăng ký dùng thử. Em sẽ phản hồi trong thời gian sớm nhất.",
  });
}
