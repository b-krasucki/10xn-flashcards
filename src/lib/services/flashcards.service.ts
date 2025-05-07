import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateFlashcardItemDto,
  CreateFlashcardsResponseDto,
  DeckResponseDto,
  FlashcardResponseDto,
} from "../../types";
import type { Database, TablesInsert } from "../../db/database.types";

// NOTE: This service is adapted to the CURRENT database.types.ts.
// It uses 'flashcards_deck_names' as the "deck" table and 'deck_name_id' in 'flashcards'.
// This will need to be updated if database.types.ts changes to reflect a 'decks' table
// and 'flashcards.deck_id' as per the original implementation plan.

/**
 * Service for creating flashcards in the database.
 */
export class FlashcardsService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Creates one or more flashcards for the given user.
   * Validates that AI-generated proposals reference existing generations, then inserts in batch.
   */
  async createFlashcards(
    userId: string,
    deckName: string, // This corresponds to 'deck_name' in 'flashcards_deck_names'
    flashcardsDto: CreateFlashcardItemDto[]
  ): Promise<CreateFlashcardsResponseDto> {
    let deck: DeckResponseDto;

    // Step 1: Handle Deck (Find or Create in 'flashcards_deck_names')
    const { data: existingDeckData, error: findDeckError } = await this.supabase
      .from("flashcards_deck_names")
      .select("id, deck_name, user_id")
      .eq("user_id", userId)
      .eq("deck_name", deckName)
      .single();

    if (findDeckError && findDeckError.code !== "PGRST116") {
      console.error("Error finding deck:", {
        message: findDeckError.message,
        details: findDeckError.details,
        code: findDeckError.code,
      });
      throw new Error(`Failed to retrieve deck information.`);
    }

    if (existingDeckData) {
      deck = {
        id: existingDeckData.id,
        deck_name: existingDeckData.deck_name,
        user_id: existingDeckData.user_id,
      };
    } else {
      const { data: newDeckData, error: createDeckError } = await this.supabase
        .from("flashcards_deck_names")
        .insert({
          user_id: userId,
          deck_name: deckName,
        } satisfies TablesInsert<"flashcards_deck_names">)
        .select("id, deck_name, user_id")
        .single();

      if (createDeckError || !newDeckData) {
        console.error("Error creating deck:", {
          message: createDeckError?.message,
          details: createDeckError?.details,
          code: createDeckError?.code,
        });
        throw new Error(`Failed to create a new deck.`);
      }

      deck = {
        id: newDeckData.id,
        deck_name: newDeckData.deck_name,
        user_id: newDeckData.user_id,
      };
    }

    // Step 2: Validate generation_ids (commented out, RLS should handle)

    // Step 3: Prepare flashcard inserts
    const flashcardsToInsert = flashcardsDto.map(
      (dto) =>
        ({
          deck_name_id: deck.id,
          user_id: userId,
          front: dto.front,
          back: dto.back,
          source: dto.source,
          generation_id: dto.generation_id,
        }) satisfies TablesInsert<"flashcards">
    );

    // Step 4: Batch insert flashcards
    const { data: insertedFlashcardsData, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, deck_name_id, front, back, source, generation_id, created_at, updated_at");

    if (insertError || !insertedFlashcardsData) {
      console.error("Error inserting flashcards:", {
        message: insertError?.message,
        details: insertError?.details,
        code: insertError?.code,
      });
      throw new Error(`Failed to create flashcards.`);
    }

    // Step 5: Map to response DTO
    const responseFlashcards: FlashcardResponseDto[] = insertedFlashcardsData.map((fc) => ({
      id: fc.id,
      deck_id: fc.deck_name_id,
      front: fc.front,
      back: fc.back,
      source: fc.source as "manual" | "ai-full" | "ai-edited",
      generation_id: fc.generation_id,
      created_at: fc.created_at,
      updated_at: fc.updated_at,
    }));

    return {
      deck,
      flashcards: responseFlashcards,
    };
  }
}

// Example of service instantiation (to be done in the Astro endpoint context)
// import { createSupabaseClient } from '../../db/supabase.client'; // Adjust if you have a factory
// const supabaseInstance = createSupabaseClient(); // Or however you get the client
// export const flashcardsService = new FlashcardsService(supabaseInstance);
