import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  // Retrieve session from Supabase auth
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();
  if (error) {
    console.error("Error retrieving session in middleware:", error);
  }
  // @ts-expect-error: extend locals with session object
  (context.locals as { session: typeof session }).session = session;
  return next();
});
