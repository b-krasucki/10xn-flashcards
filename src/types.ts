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
 * Query parameters for GET /flashcards endpoint.
 */
export interface GetFlashcardsQueryDto {
  page?: number;
  limit?: number;
  source?: "ai-full" | "ai-edited" | "manual";
  sort?: string; // Example: "created_at", "updated_at". Could be keyof Tables<'flashcards'> for stricter typing.
}

/**
 * Represents a single flashcard item within the CreateFlashcardsCommandDto.
 * Derived from `flashcards` table insert type, with a specific `source` type.
 */
export interface CreateFlashcardItemDto extends Pick<TablesInsert<"flashcards">, "front" | "back" | "generation_id"> {
  source: "manual" | "ai-full" | "ai-edited";
}

/**
 * Command model for POST /flashcards endpoint.
 */
export interface CreateFlashcardsCommandDto {
  deck_name: string; // Max 100 characters
  flashcards: CreateFlashcardItemDto[];
}

/**
 * Response DTO for deck information.
 * Derived from `flashcards_deck_names` table.
 */
export type DeckResponseDto = Pick<Tables<"flashcards_deck_names">, "id" | "deck_name" | "user_id">;

/**
 * Represents a flashcard in API responses.
 * Derived from `flashcards` table, mapping `deck_name_id` to `deck_id`
 * and narrowing the `source` type. `user_id` is omitted.
 */
export interface FlashcardResponseDto extends Omit<Tables<"flashcards">, "deck_name_id" | "source" | "user_id"> {
  /** Mapped from `deck_name_id` in the database. */
  deck_id: number | null;
  source: "manual" | "ai-full" | "ai-edited";
}

/**
 * Response DTO for POST /flashcards endpoint.
 */
export interface CreateFlashcardsResponseDto {
  deck: DeckResponseDto;
  flashcards: FlashcardResponseDto[];
}

/**
 * Command model for PUT/PATCH /flashcards/{id} endpoint.
 * Allows partial updates to front, back, and a specific set of source values.
 * Derived from `flashcards` table update type.
 */
export interface UpdateFlashcardCommandDto extends Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">> {
  source?: "ai-edited" | "manual";
}

/**
 * Response DTO for DELETE /flashcards/{id} endpoint.
 */
export interface DeleteFlashcardResponseDto {
  message: string;
}

/**
 * Command model for initiating a generation (POST /generations).
 */
export interface CreateGenerationCommandDto {
  model: string; // Example: 'gpt-4'
  source_text: string;
}

/**
 * Represents a single AI-generated flashcard proposal.
 */
export interface GenerationProposalItemDto {
  front: string;
  back: string;
  source: "ai-full"; // AI proposals are initially marked as 'ai-full'
}

/**
 * Response DTO for POST /generations endpoint.
 * Includes the ID and count of the generation, along with proposals.
 */
export interface CreateGenerationResponseDto {
  /** Corresponds to `generations.id` */
  generation_id: number;
  /** Corresponds to `generations.generated_count` */
  generated_count: number;
  proposals: GenerationProposalItemDto[];
}

/**
 * Query parameters for GET /generations endpoint.
 */
export interface GetGenerationsQueryDto {
  page?: number;
  limit?: number;
  // Add other potential sort/filter fields based on future needs
}

/**
 * Represents a generation record in a list response (GET /generations).
 * Derived directly from `generations` table.
 */
export type GenerationListItemDto = Tables<"generations">;

/**
 * Represents detailed information for a single generation (GET /generations/{id}).
 * Extends `generations` table type and includes associated flashcard proposals.
 */
export interface GenerationDetailDto extends Tables<"generations"> {
  proposals: GenerationProposalItemDto[];
}

/**
 * Query parameters for GET /generation-error-logs endpoint.
 */
export interface GetGenerationErrorLogsQueryDto {
  page?: number;
  limit?: number;
  error_code?: string;
}

/**
 * Represents a generation error log item in API responses.
 * Derived directly from `generation_error_logs` table.
 */
export type GenerationErrorLogItemDto = Tables<"generation_error_logs">;

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
