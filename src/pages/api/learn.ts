import type { APIRoute } from "astro";

import { calculateNextReview, getRecommendedSessionSize } from "../../lib/utils/spaced-repetition";

export const prerender = false;

interface LearnFlashcard {
  id: number;
  front: string;
  back: string;
  deck_name: string;
  last_reviewed_at: string | null;
  difficulty_level: number;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const deckId = url.searchParams.get("deckId");

    if (!deckId) {
      return new Response(
        JSON.stringify({
          error: "Missing deckId parameter",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client from middleware
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

    // Get flashcards for learning from the specific deck using spaced repetition algorithm

    // Get all flashcards from the deck (simplified due to missing spaced repetition columns)
    const { data: allFlashcards, error } = await supabase
      .from("flashcards")
      .select(
        `
        id,
        front,
        back,
        created_at,
        updated_at,
        flashcards_deck_names!deck_name_id (
          deck_name
        )
      `
      )
      .eq("user_id", userId)
      .eq("deck_name_id", parseInt(deckId, 10))
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch flashcards for learning");
    }

    if (!allFlashcards || allFlashcards.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // For now, just use all flashcards since spaced repetition columns don't exist
    // Limit to recommended session size (default 20 cards)
    const sessionSize = getRecommendedSessionSize(allFlashcards.length);
    const cardsToStudy = allFlashcards.slice(0, sessionSize);

    // Transform the data to match the LearnFlashcard interface
    const formattedFlashcards: LearnFlashcard[] = cardsToStudy.map((card) => {
      return {
        id: card.id,
        front: card.front,
        back: card.back,
        deck_name: card.flashcards_deck_names?.deck_name || "",
        last_reviewed_at: card.created_at, // Use created_at as fallback
        difficulty_level: 0, // Default value since column doesn't exist
      };
    });

    return new Response(JSON.stringify(formattedFlashcards), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
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

// Add POST endpoint to update flashcard review status
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { flashcardId, difficulty } = body;

    if (!flashcardId || difficulty === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: flashcardId and difficulty are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client from middleware
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

    // Validate difficulty range
    if (difficulty < 1 || difficulty > 5) {
      return new Response(
        JSON.stringify({
          error: "Difficulty must be between 1 and 5",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // First, get the current flashcard data
    const { data: currentCard, error: fetchError } = await supabase
      .from("flashcards")
      .select("id, created_at")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !currentCard) {
      throw new Error("Flashcard not found or access denied");
    }

    // Calculate next review using SM-2 algorithm (using mock data since columns don't exist)
    const reviewData = {
      easeFactor: 2.5,
      reviewCount: 0,
      lastReviewedAt: new Date(currentCard.created_at),
    };

    calculateNextReview(difficulty, reviewData);

    // Update the flashcard with new spaced repetition data (limited due to schema)
    const { data, error } = await supabase
      .from("flashcards")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select();

    if (error) {
      throw new Error("Failed to update flashcard review status");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
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
