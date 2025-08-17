import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

// Support both import.meta.env (Astro/Vite) and process.env (Node.js/tests)
const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_URL) || process.env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) ||
  process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "83fc0e1a-cf9d-4fc6-815b-9707ae443da0"; //DEV user id
