import type { APIRoute } from "astro";

export const prerender = false;

interface UserBasicData {
  email: string;
  id: string;
}

/**
 * GET /api/user - Returns basic user data for UI components
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log("User API called");

    // Get Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      console.error("Supabase client not available in user API");
      return new Response(JSON.stringify({ error: "Supabase client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("User API: User not authenticated", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("User API: User authenticated", user.id);

    const userData: UserBasicData = {
      email: user.email || "user@example.com",
      id: user.id,
    };

    console.log("User API: Returning user data", userData);

    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("User API error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
