import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { validateFeedbackPayload } from "@/lib/feedback";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Dữ liệu góp ý chưa hợp lệ." }, { status: 400 });
  }

  const validated = validateFeedbackPayload(body);
  if (!validated.ok) return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, storage: "local" });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Vui lòng đăng nhập để gửi góp ý." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Chưa gửi được góp ý. Vui lòng thử lại." }, { status: 503 });

  const { data } = validated;
  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    user_email: user.email,
    user_role: user.role,
    category: data.category,
    tool: data.tool,
    rating: data.rating,
    message: data.message,
    contact: data.contact || null,
    path: data.path || request.nextUrl.pathname,
    user_agent: data.userAgent || request.headers.get("user-agent") || "",
    status: "new",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "Chưa gửi được góp ý. Vui lòng thử lại." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
