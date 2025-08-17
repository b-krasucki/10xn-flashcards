import type { APIRoute } from "astro";

export const prerender = false;

interface UserProfile {
  email: string;
  created_at: string;
  total_flashcards: number;
  total_generations: number;
}

/**
 * GET /api/profile - Returns user profile data including statistics
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    console.log('Profile API called');
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      console.error('Supabase client not available in profile API');
      throw new Error("Supabase client not available");
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Profile API: User not authenticated', userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log('Profile API: User authenticated', user.id);

    const userId = user.id;

    // Get user statistics directly
    const { count: totalFlashcards } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: totalGenerations } = await supabase
      .from("generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const profile: UserProfile = {
      email: user.email || "Brak adresu e-mail",
      created_at: user.created_at || new Date().toISOString(),
      total_flashcards: totalFlashcards || 0,
      total_generations: totalGenerations || 0
    };

    console.log('Profile API: Returning profile', profile);

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    console.error('Profile API error:', error);
    
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
