import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardProposalDto, FlashcardDto } from "../../types";

/**
 * Service for creating flashcards in the database.
 */
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Creates one or more flashcards for the given user.
   * Validates that AI-generated proposals reference existing generations, then inserts in batch.
   */
  async createFlashcards(userId: string, proposals: FlashcardProposalDto[]): Promise<FlashcardDto[]> {
    // Validate AI proposals have existing generation_id
    const aiProposals = proposals.filter((p) => p.source !== "manual");
    const generationIds = Array.from(new Set(aiProposals.map((p) => p.generation_id)));
    if (generationIds.length > 0) {
      const { data: gens, error: genError } = await this.supabase
        .from("generations")
        .select("id")
        .in("id", generationIds);
      if (genError) {
        throw new Error("Database error checking generation_ids: " + genError.message);
      }
      const foundIds = gens?.map((g) => g.id) ?? [];
      const missing = generationIds.filter((id) => !foundIds.includes(id));
      if (missing.length > 0) {
        throw new Error("Generation not found: " + missing.join(","));
      }
    }

    // Prepare batch insert records
    const insertRecords = proposals.map((p) => ({
      user_id: userId,
      front: p.front,
      back: p.back,
      source: p.source,
      generation_id: p.source === "manual" ? null : p.generation_id,
    }));

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(insertRecords)
      .select("id, front, back, source, generation_id, created_at, updated_at");
    if (error || !data) {
      throw new Error("Database error inserting flashcards: " + error?.message);
    }

    return data;
  }
}
