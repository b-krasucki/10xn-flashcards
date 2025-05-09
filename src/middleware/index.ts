import { defineMiddleware } from "astro:middleware";
import type { Database } from "../db/database.types";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required environment variables (PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY)");
}

const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  // Disable auth for testing - just set the Supabase client
  locals.supabase = supabaseClient;
  return next();
});
