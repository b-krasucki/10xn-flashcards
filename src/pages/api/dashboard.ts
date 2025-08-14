import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

interface DashboardStats {
  totalFlashcards: number;
  generatedFlashcards: number;
  editedFlashcards: number;
  acceptedFlashcards: number;
  recentGenerations: {
    id: number;
    created_at: string;
    generated_count: number;
    model: string;
    deck_name: string | null;
    deck_id: number | null;
  }[];
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Initialize Supabase client (same way as in other API endpoints)
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
    const testUserId = import.meta.env.TEST_USER;

    if (!supabaseUrl || !supabaseAnonKey || !testUserId) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Get total flashcards count
    const { count: totalFlashcards, error: totalError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId);

    if (totalError) {
      console.error("Error fetching total flashcards:", totalError);
      throw new Error("Failed to fetch total flashcards");
    }

    // Get AI-generated flashcards count
    const { count: generatedFlashcards, error: generatedError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId)
      .in("source", ["ai-full", "ai-edited"]);

    if (generatedError) {
      console.error("Error fetching generated flashcards:", generatedError);
      throw new Error("Failed to fetch generated flashcards");
    }

    // Get edited flashcards count (AI-generated that were modified)
    const { count: editedFlashcards, error: editedError } = await supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", testUserId)
      .eq("source", "ai-edited");

    if (editedError) {
      console.error("Error fetching edited flashcards:", editedError);
      throw new Error("Failed to fetch edited flashcards");
    }

    // Get accepted flashcards count from recent generations
    const { data: acceptedData, error: acceptedError } = await supabase
      .from("generations")
      .select("accepted_unedited_count, accepted_edited_count")
      .eq("user_id", testUserId)
      .not("accepted_unedited_count", "is", null)
      .not("accepted_edited_count", "is", null);

    if (acceptedError) {
      console.error("Error fetching accepted flashcards:", acceptedError);
      throw new Error("Failed to fetch accepted flashcards");
    }

    const acceptedFlashcards = acceptedData?.reduce(
      (sum, gen) => sum + (gen.accepted_unedited_count || 0) + (gen.accepted_edited_count || 0),
      0
    ) || 0;

    // Get recent generations (last 3) with deck names
    const { data: recentGenerationsData, error: recentError } = await supabase
      .from("generations")
      .select("id, created_at, generated_count, model")
      .eq("user_id", testUserId)
      .order("created_at", { ascending: false })
      .limit(3);

    if (recentError) {
      console.error("Error fetching recent generations:", recentError);
      throw new Error("Failed to fetch recent generations");
    }

    // For each generation, get the deck name and deck_id from the first flashcard
    const recentGenerations = [];
    for (const generation of recentGenerationsData || []) {
      const { data: flashcardData, error: flashcardError } = await supabase
        .from('flashcards')
        .select(`
          deck_name_id,
          flashcards_deck_names!deck_name_id(
            deck_name
          )
        `)
        .eq('generation_id', generation.id)
        .eq('user_id', testUserId)
        .limit(1)
        .single();

      const deck_name = flashcardData?.flashcards_deck_names?.deck_name || null;
      const deck_id = flashcardData?.deck_name_id || null;
      
      recentGenerations.push({
        ...generation,
        deck_name,
        deck_id
      });
    }

    const stats: DashboardStats = {
      totalFlashcards: totalFlashcards || 0,
      generatedFlashcards: generatedFlashcards || 0,
      editedFlashcards: editedFlashcards || 0,
      acceptedFlashcards,
      recentGenerations: recentGenerations || [],
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    
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
