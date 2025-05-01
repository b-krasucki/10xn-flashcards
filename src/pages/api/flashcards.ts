import type { APIRoute } from "astro";
import { createFlashcardsSchema } from "../../lib/schemas/flashcards.schema";
import type { CreateFlashcardsSchema } from "../../lib/schemas/flashcards.schema";
import type { CreateFlashcardsResponseDto, ErrorResponseDto } from "../../types";
import { FlashcardsService } from "../../lib/services/flashcards.service";
import type { SupabaseClient } from "../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
// import type { Session } from "@supabase/supabase-js"; // disabled auth for tests

export const prerender = false;

/**
 * POST /flashcards - Create one or many flashcard proposals
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // For testing: skip authorization and use default user
  const supabase = locals.supabase as SupabaseClient;
  const userId = DEFAULT_USER_ID;

  // Parse and validate request body
  let parsed: CreateFlashcardsSchema;
  try {
    const body = await request.json();
    const result = createFlashcardsSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: "Validation error", details: result.error.errors }), { status: 400 });
    }
    parsed = result.data;
  } catch (err: unknown) {
    console.error("Invalid JSON payload:", err);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" } as ErrorResponseDto), { status: 400 });
  }

  // Business logic: create flashcards
  try {
    const service = new FlashcardsService(supabase);
    const created = await service.createFlashcards(userId, parsed.flashcardsProposals);
    return new Response(JSON.stringify({ flashcardsProposals: created } as CreateFlashcardsResponseDto), {
      status: 201,
    });
  } catch (error: unknown) {
    console.error("Error creating flashcards:", error);
    const err = error instanceof Error ? error : new Error(String(error));
    // Handle missing generation_id scenario
    if (err.message.startsWith("Generation not found")) {
      return new Response(JSON.stringify({ error: err.message } as ErrorResponseDto), { status: 404 });
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" } as ErrorResponseDto), { status: 500 });
  }
};
