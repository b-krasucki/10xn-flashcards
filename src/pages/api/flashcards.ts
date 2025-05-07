import type { APIRoute } from "astro";
import { createFlashcardsSchema } from "../../lib/schemas/flashcards.schema";
// CreateFlashcardsSchema is imported from its definition file if needed by createFlashcardsSchema object
import type {
  /* CreateFlashcardsResponseDto, */ ErrorResponseDto,
  FlashcardDto,
  FlashcardProposalDto /* CreateFlashcardItemDto */,
} from "../../types";
import { FlashcardsService } from "../../lib/services/flashcards.service";
import type { SupabaseClient } from "../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
// import type { Session } from "@supabase/supabase-js"; // disabled auth for tests

export const prerender = false;

// Based on linter errors, parsed is: { flashcardsProposals: Array<FlashcardInputType> }
// FlashcardProposalDto or CreateFlashcardItemDto could be the item type.
// Using FlashcardProposalDto as it's a more general input type defined in types.ts
interface ParsedFlashcardsInput {
  flashcardsProposals: FlashcardProposalDto[];
}

/**
 * POST /flashcards - Create one or many flashcard proposals
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // For testing: skip authorization and use default user
  const supabase = locals.supabase as SupabaseClient;
  const userId = DEFAULT_USER_ID;

  // Parse and validate request body
  let parsed: ParsedFlashcardsInput;
  try {
    const body = await request.json();
    const result = createFlashcardsSchema.safeParse(body);
    if (!result.success) {
      return new Response(JSON.stringify({ error: "Validation error", details: result.error.errors }), { status: 400 });
    }
    parsed = result.data as ParsedFlashcardsInput; // Assuming schema aligns with this structure
  } catch (err: unknown) {
    console.error("Invalid JSON payload:", err);
    return new Response(JSON.stringify({ error: "Invalid JSON payload" } as ErrorResponseDto), { status: 400 });
  }

  // Business logic: create flashcards
  try {
    const service = new FlashcardsService(supabase);
    // Based on linter errors, service.createFlashcards takes (userId, proposals) and returns Promise<FlashcardDto[]>
    const createdFlashcards: FlashcardDto[] = await service.createFlashcards(userId, parsed.flashcardsProposals);

    // Constructing a partial response. Deck information is missing as it's not available.
    // This will not fully match CreateFlashcardsResponseDto.
    // To fully match, FlashcardsService.createFlashcards and potentially createFlashcardsSchema need changes.
    const partialResponse = {
      // deck: undefined, // DeckResponseDto - cannot be constructed here
      flashcards: createdFlashcards, // This is FlashcardDto[], CreateFlashcardsResponseDto expects FlashcardResponseDto[]
    };

    return new Response(JSON.stringify(partialResponse), {
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
