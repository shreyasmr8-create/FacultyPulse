import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ojtnclphstwolqlkbclu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Standard Supabase client for client-side operations (e.g. file downloads, public reads)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Privileged Supabase client for server-side admin operations (e.g. storage management, migrations)
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
