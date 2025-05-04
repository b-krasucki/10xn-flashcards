import { defineMiddleware } from "astro:middleware";
import type { Database } from "../db/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

// TESTING: Mock user for development
const mockUser: App.Locals["user"] = {
  id: "test-user-id",
  email: "test@example.com",
};

type MockData = Record<string, unknown>;

// TESTING: Mock Supabase client
const mockSupabase = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  from: (_table: string) => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    insert: (_data: MockData) => ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      select: (_column: string) => ({
        single: async () => ({
          data: { id: 1 },
          error: null,
        }),
      }),
    }),
  }),
  auth: {
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
  },
} as unknown as SupabaseClient<Database>;

export const onRequest = defineMiddleware(async ({ locals }, next) => {
  // TESTING: Use mock Supabase client and user
  locals.supabase = mockSupabase;
  locals.user = mockUser;
  return next();
});
