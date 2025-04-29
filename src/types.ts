import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * Data Transfer Objects (DTOs) and Command Model definitions for the API.
 */

/**
 * Flashcard Data Transfer Object for responses.
 * Maps to the 'flashcards' table's Row type, excluding internal user_id.
 */
export type FlashcardDto = Pick<
  Tables<"flashcards">,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

/**
 * Base type for creating flashcard proposals (command model).
 * Omits DB-assigned fields: id, created_at, updated_at, user_id.
 */
type BaseFlashcardProposal = Omit<TablesInsert<"flashcards">, "id" | "created_at" | "updated_at" | "user_id">;

/**
 * Manual flashcard proposal (no generation reference).
 */
export type ManualFlashcardProposalDto = Omit<BaseFlashcardProposal, "generation_id"> & {
  source: "manual";
  generation_id: null;
};

/**
 * AI-generated flashcard proposal.
 */
export type AiFlashcardProposalDto = BaseFlashcardProposal & {
  source: "ai-full" | "ai-edited";
  generation_id: number;
};

/**
 * Union type for flashcard proposals in CreateFlashcardsCommandDto.
 */
export type FlashcardProposalDto = ManualFlashcardProposalDto | AiFlashcardProposalDto;

/**
 * Command model for creating one or more flashcards (POST /flashcards).
 */
export interface CreateFlashcardsCommandDto {
  flashcardsProposals: FlashcardProposalDto[];
}

/**
 * Response DTO for created flashcards (POST /flashcards).
 */
export interface CreateFlashcardsResponseDto {
  flashcardsProposals: FlashcardDto[];
}

/**
 * Command model for updating a flashcard (PUT/PATCH /flashcards/{id}).
 */
export type UpdateFlashcardCommandDto = Pick<TablesUpdate<"flashcards">, "front" | "back" | "source">;

/**
 * Response DTO for deletion of a flashcard (DELETE /flashcards/{id}).
 */
export interface DeleteFlashcardResponseDto {
  message: string;
}

/**
 * Command model for initiating a generation (POST /generations).
 */
export type CreateGenerationCommandDto = Pick<TablesInsert<"generations">, "model"> & {
  source_text: string;
};

/**
 * DTO for each proposal returned by the generation endpoints.
 */
export type GenerationProposalDto = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
  source: "ai-full";
};

/**
 * Response DTO for generation initiation (POST /generations).
 */
export interface CreateGenerationResponseDto {
  generation_id: Tables<"generations">["id"];
  generated_count: Tables<"generations">["generated_count"];
  proposals: GenerationProposalDto[];
}

/**
 * Summary DTO for listing generations (GET /generations).
 */
export type GenerationListItemDto = Pick<
  Tables<"generations">,
  | "id"
  | "model"
  | "generated_count"
  | "generation_duration"
  | "source_text_hash"
  | "source_text_lenght"
  | "created_at"
  | "updated_at"
  | "accepted_edited_count"
  | "accepted_unedited_count"
>;

/**
 * Detailed DTO for a single generation including its proposals (GET /generations/{id}).
 */
export interface GenerationDetailDto extends GenerationListItemDto {
  proposals: FlashcardDto[];
}

/**
 * DTO for generation error logs (GET /generation-error-logs).
 */
export type GenerationErrorLogDto = Omit<Tables<"generation_error_logs">, "user_id">;

/**
 * Generic DTO for pagination parameters.
 */
export interface PaginationParamsDto {
  page?: number;
  limit?: number;
}

/**
 * Generic error response DTO.
 */
export interface ErrorResponseDto {
  error: string;
}
