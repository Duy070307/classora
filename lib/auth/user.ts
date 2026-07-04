import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRole, type UserRole } from "@/lib/auth/roles";

export type SafeUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<SafeUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: typeof profile?.full_name === "string" ? profile.full_name : "",
    role: normalizeRole(profile?.role)
  };
}

export async function getCurrentProfile() {
  return getCurrentUser();
}
