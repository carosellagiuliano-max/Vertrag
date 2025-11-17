import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "@/lib/config/env";

type Database = Record<string, never>;

export function getServiceRoleClient() {
  if (!hasSupabaseConfig || !env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
