import { defineMiddleware } from "astro:middleware";
import type { Database } from "../db/database.types";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client - support both import.meta.env (Astro/Vite) and process.env (Node.js/tests)
const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_URL) || process.env.PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_ANON_KEY) ||
  process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required environment variables (PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY)");
}

const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Protected routes that require authentication
const protectedRoutes = ["/", "/generate", "/flashcards", "/learn", "/profile", "/deck"];

// Public routes that don't require authentication
const publicRoutes = ["/auth", "/privacy"];

export const onRequest = defineMiddleware(async ({ locals, url, request, redirect }, next) => {
  // Set the Supabase client in locals for use in API routes
  locals.supabase = supabaseClient;

  const pathname = url.pathname;

  // Check if this is an API route - handle authentication there
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Check if this is a public route
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return next();
  }

  // For protected routes, check authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    try {
      // Get session from cookies
      const accessToken = request.headers
        .get("cookie")
        ?.split(";")
        .find((c) => c.trim().startsWith("sb-access-token="))
        ?.split("=")[1];

      const refreshToken = request.headers
        .get("cookie")
        ?.split(";")
        .find((c) => c.trim().startsWith("sb-refresh-token="))
        ?.split("=")[1];

      if (!accessToken && !refreshToken) {
        return redirect("/auth");
      }

      // Set session if tokens exist
      if (accessToken && refreshToken) {
        await supabaseClient.auth.setSession({
          access_token: decodeURIComponent(accessToken),
          refresh_token: decodeURIComponent(refreshToken),
        });
      }

      // Get current user
      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser();

      if (error || !user) {
        return redirect("/auth");
      }

      // Store user in locals for use in pages
      locals.user = user;
    } catch (error) {
      console.error("Auth middleware error:", error);
      return redirect("/auth");
    }
  }

  return next();
});
