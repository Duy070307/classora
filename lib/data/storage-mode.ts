"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getStorageMode() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return { mode: "local" as const, userId: null };
  const { data } = await supabase.auth.getUser();
  return data.user ? { mode: "cloud" as const, userId: data.user.id } : { mode: "local" as const, userId: null };
}

export async function getCloudClientForUser() {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { supabase, user: data.user };
}
