import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

/**
 * DELETE /api/deleteAccount - Permanently deletes user account and all associated data
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Get regular Supabase client from middleware for user authentication
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log(`Starting account deletion process for user: ${userId}`);

    // Delete user data in correct order (due to foreign key constraints)
    // 1. Delete flashcards first
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", userId);

    if (flashcardsError) {
      console.error("Error deleting flashcards:", flashcardsError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete flashcards",
          details: flashcardsError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Delete deck names
    const { error: decksError } = await supabase.from("flashcards_deck_names").delete().eq("user_id", userId);

    if (decksError) {
      console.error("Error deleting decks:", decksError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete decks",
          details: decksError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Delete generations records
    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", userId);

    if (generationsError) {
      console.error("Error deleting generations:", generationsError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete generations",
          details: generationsError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Delete error logs
    const { error: errorLogsError } = await supabase.from("generation_error_logs").delete().eq("user_id", userId);

    if (errorLogsError) {
      console.error("Error deleting error logs:", errorLogsError);
      // Don't fail the deletion for error logs, just log it
      console.warn("Failed to delete error logs, continuing with account deletion");
    }

    // 5. Finally, delete the user account from Supabase Auth using admin client
    // Create admin client with service role key for user deletion
    const supabaseUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_SUPABASE_URL) || process.env.PUBLIC_SUPABASE_URL;
    const supabaseServiceKey =
      (typeof import.meta !== "undefined" && import.meta.env?.SUPABASE_SERVICE_ROLE_KEY) ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      return new Response(
        JSON.stringify({
          error: "Server configuration error - cannot delete user account",
          details: "Service role key not configured",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting user from auth:", authError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete user account",
          details: authError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account successfully deleted",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("API Error during account deletion:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
