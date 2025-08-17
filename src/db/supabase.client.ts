import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "https://mock-project.supabase.co";
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key-for-testing";

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "83fc0e1a-cf9d-4fc6-815b-9707ae443da0"; //DEV user id
