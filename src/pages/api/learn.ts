import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { calculateNextReview, difficultyToText, getCardsDueForReview, getRecommendedSessionSize } from "../../lib/utils/spaced-repetition";

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

    // Initialize Supabase client (same way as in other API endpoints)
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
    const testUserId = import.meta.env.TEST_USER;

    if (!supabaseUrl || !supabaseAnonKey || !testUserId) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Get flashcards for learning from the specific deck using spaced repetition algorithm
    
    // Get all flashcards with spaced repetition data from the deck
    const { data: allFlashcards, error } = await supabase
      .from("flashcards")
      .select(`
        id,
        front,
        back,
        last_reviewed_at,
        difficulty_level,
        next_review_date,
        review_count,
        ease_factor,
        flashcards_deck_names!deck_name_id (
          deck_name
        )
      `)
      .eq("user_id", testUserId)
      .eq("deck_name_id", deckId)
      .order("next_review_date", { ascending: true, nullsFirst: true }); // Priority to cards due for review
    

    if (error) {
      console.error("Error fetching flashcards for learning:", error);
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

    // Use spaced repetition algorithm to filter cards due for review
    const cardsDue = getCardsDueForReview(allFlashcards);
    
    // If no cards are due, include some new cards or cards that haven't been reviewed in a while
    let cardsToStudy = cardsDue;
    if (cardsToStudy.length === 0) {
      // Include cards that have never been reviewed (new cards)
      const newCards = allFlashcards.filter(card => !card.last_reviewed_at);
      const oldCards = allFlashcards.filter(card => card.last_reviewed_at)
        .sort((a, b) => {
          // Sort by last reviewed date (oldest first)
          const dateA = new Date(a.last_reviewed_at!).getTime();
          const dateB = new Date(b.last_reviewed_at!).getTime();
          return dateA - dateB;
        });
      
      cardsToStudy = [...newCards.slice(0, 10), ...oldCards.slice(0, 5)]; // Up to 15 cards
    } else {
      // Limit to recommended session size
      const sessionSize = getRecommendedSessionSize(cardsToStudy.length);
      cardsToStudy = cardsToStudy.slice(0, sessionSize);
    }

    // Transform the data to match the LearnFlashcard interface
    const formattedFlashcards: LearnFlashcard[] = cardsToStudy.map((card) => {
      return {
        id: card.id,
        front: card.front,
        back: card.back,
        deck_name: card.flashcards_deck_names?.deck_name || "",
        last_reviewed_at: card.last_reviewed_at,
        difficulty_level: card.difficulty_level || 0,
      };
    });
    

    return new Response(JSON.stringify(formattedFlashcards), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Learn API error:", error);
    
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

    // Initialize Supabase client
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
    const testUserId = import.meta.env.TEST_USER;

    if (!supabaseUrl || !supabaseAnonKey || !testUserId) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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
      .select("id, ease_factor, review_count, last_reviewed_at")
      .eq("id", flashcardId)
      .eq("user_id", testUserId)
      .single();

    if (fetchError || !currentCard) {
      console.error("Error fetching current flashcard:", fetchError);
      throw new Error("Flashcard not found or access denied");
    }

    // Calculate next review using SM-2 algorithm
    const reviewData = {
      easeFactor: currentCard.ease_factor || 2.5,
      reviewCount: currentCard.review_count || 0,
      lastReviewedAt: currentCard.last_reviewed_at ? new Date(currentCard.last_reviewed_at) : null,
    };

    const spacedRepetitionResult = calculateNextReview(difficulty, reviewData);
    
    console.log('Spaced repetition calculation:', {
      flashcardId,
      difficulty,
      difficultyText: difficultyToText(difficulty),
      currentReviewData: reviewData,
      result: spacedRepetitionResult
    });

    // Update the flashcard with new spaced repetition data
    const { data, error } = await supabase
      .from("flashcards")
      .update({
        last_reviewed_at: new Date().toISOString(),
        difficulty_level: difficulty,
        next_review_date: spacedRepetitionResult.nextReviewDate.toISOString(),
        review_count: spacedRepetitionResult.reviewCount,
        ease_factor: spacedRepetitionResult.easeFactor,
      })
      .eq("id", flashcardId)
      .eq("user_id", testUserId)
      .select();

    if (error) {
      console.error("Error updating flashcard review status:", error);
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
    console.error("Learn API error:", error);
    
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
