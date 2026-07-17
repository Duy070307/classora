import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { maintenanceAccessDecision } from "@/lib/maintenance-access";
import { getMaintenanceSettings, isMaintenanceBypassed } from "@/lib/maintenance";

const protectedPrefixes = [
  "/admin",
  "/dashboard",
  "/data",
  "/history",
  "/print",
  "/question-bank",
  "/settings",
  "/templates",
  "/teacher-testing-guide",
  "/tikz-bank"
];

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isProtected(pathname: string) {
  if (pathname === "/tools" || pathname.startsWith("/tools/")) return true;
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const pathname = request.nextUrl.pathname;
  const { data } = await supabase.auth.getUser();

  if (isProtected(pathname) && !data.user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Khu vực quản trị tự kiểm tra role ở page/API và phải luôn truy cập được để admin có thể tắt bảo trì.
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) return response;

  if (data.user) {
    const [{ data: profile }, maintenance] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle(),
      getMaintenanceSettings(),
    ]);
    const identity = { email: data.user.email || "", role: profile?.role === "admin" ? "admin" as const : "teacher" as const };
    const decision = maintenanceAccessDecision({
      pathname,
      enabled: maintenance.enabled,
      authenticated: true,
      role: isMaintenanceBypassed(identity) ? "admin" : "teacher",
    });
    if (decision === "redirect") {
      const maintenanceUrl = request.nextUrl.clone();
      maintenanceUrl.pathname = "/maintenance";
      maintenanceUrl.search = "";
      return NextResponse.redirect(maintenanceUrl);
    }
    if (decision === "block_api") {
      return NextResponse.json({ ok: false, maintenance: true, message: maintenance.message }, { status: 503 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|icon-192.png|icon-512.png|apple-icon.png|og-image.png|manifest.json|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};
