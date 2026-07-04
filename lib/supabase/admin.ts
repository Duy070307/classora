import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/lib/supabase/is-configured";

export function createSupabaseAdminClient() {
  if (!isSupabaseAdminConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
