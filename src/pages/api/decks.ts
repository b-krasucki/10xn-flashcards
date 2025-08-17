import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
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

    // Get all decks for the user
    const { data: decks, error } = await supabase
      .from("flashcards_deck_names")
      .select("id, deck_name, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching decks:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch decks", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get flashcard counts for each deck
    const transformedDecks = [];
    for (const deck of decks || []) {
      const { count: flashcard_count, error: countError } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("deck_name_id", deck.id)
        .eq("user_id", userId);

      transformedDecks.push({
        id: deck.id,
        deck_name: deck.deck_name,
        created_at: deck.created_at,
        updated_at: deck.updated_at,
        flashcard_count: flashcard_count || 0,
      });
    }

    return new Response(
      JSON.stringify({
        decks: transformedDecks,
        total: transformedDecks.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ url, locals }) => {
  try {
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

    const deckId = url.searchParams.get("id");

    if (!deckId) {
      return new Response(JSON.stringify({ error: "Deck ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, delete all flashcards in this deck
    const { error: flashcardsError } = await supabase
      .from("flashcards")
      .delete()
      .eq("deck_name_id", parseInt(deckId, 10))
      .eq("user_id", userId);

    if (flashcardsError) {
      console.error("Error deleting flashcards:", flashcardsError);
      return new Response(JSON.stringify({ error: "Failed to delete deck flashcards" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Then delete the deck
    const { error: deckError } = await supabase
      .from("flashcards_deck_names")
      .delete()
      .eq("id", parseInt(deckId, 10))
      .eq("user_id", userId);

    if (deckError) {
      console.error("Error deleting deck:", deckError);
      return new Response(JSON.stringify({ error: "Failed to delete deck" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    const body = await request.json();
    const { deck_name } = body;

    if (!deck_name || !deck_name.trim()) {
      return new Response(JSON.stringify({ error: "Deck name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create new deck
    const { data, error } = await supabase
      .from("flashcards_deck_names")
      .insert({
        deck_name: deck_name.trim(),
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating deck:", error);
      return new Response(JSON.stringify({ error: "Failed to create deck" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        deck: {
          id: data.id,
          deck_name: data.deck_name,
          created_at: data.created_at,
          updated_at: data.updated_at,
          flashcard_count: 0,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, url, locals }) => {
  try {
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

    const deckId = url.searchParams.get("id");

    if (!deckId) {
      return new Response(JSON.stringify({ error: "Deck ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { deck_name } = body;

    if (!deck_name || !deck_name.trim()) {
      return new Response(JSON.stringify({ error: "Deck name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the deck name
    const { data, error } = await supabase
      .from("flashcards_deck_names")
      .update({
        deck_name: deck_name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(deckId, 10))
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deck:", error);
      return new Response(JSON.stringify({ error: "Failed to update deck" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ deck: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
