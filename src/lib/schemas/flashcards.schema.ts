import { z } from "zod";

/**
 * Schema definitions for flashcard proposals and create request
 */
const manualFlashcardProposalSchema = z.object({
  front: z.string().min(1, "Front text is required").max(200, "Front text cannot exceed 200 characters"),
  back: z.string().min(1, "Back text is required").max(500, "Back text cannot exceed 500 characters"),
  source: z.literal("manual"),
  generation_id: z.null(),
});

const aiFlashcardProposalSchema = z.object({
  front: z.string().min(1, "Front text is required").max(200, "Front text cannot exceed 200 characters"),
  back: z.string().min(1, "Back text is required").max(500, "Back text cannot exceed 500 characters"),
  source: z.enum(["ai-full", "ai-edited"]),
  generation_id: z.number(),
});

export const flashcardProposalSchema = z.discriminatedUnion("source", [
  manualFlashcardProposalSchema,
  aiFlashcardProposalSchema,
]);

export const createFlashcardsSchema = z.object({
  flashcardsProposals: z
    .array(flashcardProposalSchema)
    .min(1, "At least one flashcard proposal is required")
    .max(50, "Cannot create more than 50 flashcards at a time"),
});

export type CreateFlashcardsSchema = z.infer<typeof createFlashcardsSchema>;
