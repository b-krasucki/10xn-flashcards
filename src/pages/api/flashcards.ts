import type { APIRoute } from "astro";
import { createFlashcardsSchema } from "../../lib/schemas/flashcards.schema";
import type { CreateFlashcardsCommandDto, ErrorResponseDto } from "../../types";
import { FlashcardsService } from "../../lib/services/flashcards.service";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      throw new Error("Supabase client not available");
    }

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const userId = user.id;
    
    // Initialize service
    const flashcardsService = new FlashcardsService(supabase);

    // Get query parameters
    const generationId = url.searchParams.get('generation');
    const deckId = url.searchParams.get('deck');

    // Build the query - query flashcards table with proper joins
    let query = supabase
      .from('flashcards')
      .select(`
        id,
        front,
        back,
        source,
        generation_id,
        created_at,
        updated_at,
        flashcards_deck_names!deck_name_id(
          deck_name
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Apply generation filter if provided
    if (generationId) {
      query = query.eq('generation_id', parseInt(generationId, 10));
    }

    // Apply deck filter if provided
    if (deckId) {
      query = query.eq('deck_name_id', parseInt(deckId, 10));
    }

    const { data: flashcards, error } = await query;

    if (error) {
      console.error('Error fetching flashcards:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch flashcards', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Transform the data to match the expected format
    const transformedFlashcards = (flashcards || []).map(flashcard => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      deck_name: flashcard.flashcards_deck_names?.deck_name,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at
    }));

    return new Response(JSON.stringify({ 
      flashcards: transformedFlashcards,
      total: transformedFlashcards.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const userId = user.id;
    
    // Initialize service
    const flashcardsService = new FlashcardsService(supabase);

    // 1. Parse and validate JSON
    let commandDto: CreateFlashcardsCommandDto;
    try {
      const body = await request.json();
      const validationResult = createFlashcardsSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Invalid request body",
            details: validationResult.error.flatten(),
          } as ErrorResponseDto),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      commandDto = validationResult.data;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON format" } as ErrorResponseDto), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Call service to create flashcards
    const result = await flashcardsService.createFlashcards(userId, commandDto.deck_name, commandDto.flashcards);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error creating flashcards:", error);

    let status = 500;
    let errorMessage = "Internal Server Error";

    if (error instanceof Error) {
      errorMessage = error.message;
      // Map specific error messages to status codes
      if (errorMessage.includes("not found")) {
        status = 404;
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("not allowed")) {
        status = 403;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.cause : undefined,
      } as ErrorResponseDto),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
