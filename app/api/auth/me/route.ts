import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/user";
import { isRegistrationEnabled, isSupabaseConfigured } from "@/lib/supabase/is-configured";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authenticationReady: isSupabaseConfigured(),
    registrationEnabled: isRegistrationEnabled(),
    user
  });
}
