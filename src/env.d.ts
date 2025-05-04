/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

interface User {
  id: string;
  email: string | undefined;
  // Add other user properties as needed
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database> | null;
      user: User | null;
    }
  }

  interface ImportMetaEnv {
    readonly PUBLIC_SUPABASE_URL: string;
    readonly PUBLIC_SUPABASE_ANON_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
