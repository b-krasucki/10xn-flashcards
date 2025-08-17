import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

interface DashboardStats {
  totalFlashcards: number;
  generatedFlashcards: number;
  editedFlashcards: number;
  manualFlashcards: number;
  recentGenerations: {
    id: number;
    created_at: string;
    generated_count: number;
    model: string;
    deck_name: string | null;
    deck_id: number | null;
  }[];
}

export const GET: APIRoute = async ({ locals, request }) => {
  try {
    console.log('Dashboard API called');
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      console.error('Supabase client not available in dashboard API');
      throw new Error("Supabase client not available");
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Dashboard API: User not authenticated', userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    console.log('Dashboard API: User authenticated', user.id);

    const userId = user.id;

    // Get total flashcards count
    const { count: totalFlashcards, error: totalError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (totalError) {
      throw new Error("Failed to fetch total flashcards");
    }

    // Get AI-generated flashcards count
    const { count: generatedFlashcards, error: generatedError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("source", ["ai-full", "ai-edited"]);

    if (generatedError) {
      throw new Error("Failed to fetch generated flashcards");
    }

    // Get edited flashcards count (AI-generated that were modified)
    const { count: editedFlashcards, error: editedError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "ai-edited");

    if (editedError) {
      throw new Error("Failed to fetch edited flashcards");
    }

    // Get manual flashcards count (flashcards added manually by user)
    const { count: manualFlashcards, error: manualError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "manual");

    if (manualError) {
      throw new Error("Failed to fetch manual flashcards");
    }

    // Get recent generations (last 3) with deck names
    const { data: recentGenerationsData, error: recentError } = await supabase
      .from("generations")
      .select("id, created_at, generated_count, model")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentError) {
      throw new Error("Failed to fetch recent generations");
    }

    // For each generation, get the deck name, deck_id and actual flashcard count
    const recentGenerations = [];
    for (const generation of recentGenerationsData || []) {
      // Get actual flashcard count for this generation
      const { count: actualFlashcardCount, error: countError } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('generation_id', generation.id)
        .eq('user_id', userId);

      if (countError) {
        // Silently handle count error, use 0 as fallback
      }

      // Get deck info from the first flashcard
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .select(`
          deck_name_id,
          flashcards_deck_names!deck_name_id(
            deck_name
          )
        `)
        .eq('generation_id', generation.id)
        .eq('user_id', userId)
        .limit(1)
        .single();

      const deck_name = flashcardData?.flashcards_deck_names?.deck_name || null;
      const deck_id = flashcardData?.deck_name_id || null;
      
      recentGenerations.push({
        ...generation,
        generated_count: actualFlashcardCount || 0, // Use actual count instead of stored count
        deck_name,
        deck_id
      });
    }

    const stats: DashboardStats = {
      totalFlashcards: totalFlashcards || 0,
      generatedFlashcards: generatedFlashcards || 0,
      editedFlashcards: editedFlashcards || 0,
      manualFlashcards: manualFlashcards || 0,
      recentGenerations: recentGenerations || [],
    };

    console.log('Dashboard API: Returning stats', stats);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    
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
