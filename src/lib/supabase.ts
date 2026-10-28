import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PREVIEW_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config";

export const supabase: SupabaseClient | null = PREVIEW_MODE ? null : createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
