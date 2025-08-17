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

export const createFlashcardItemSchema = z
  .object({
    front: z.string().min(1, "Front text is required").max(200, "Front text cannot exceed 200 characters"),
    back: z.string().min(1, "Back text is required").max(500, "Back text cannot exceed 500 characters"),
    source: z.enum(["manual", "ai-full", "ai-edited"]),
    generation_id: z.number().nullable(), // Initially allow null, refined below
  })
  .superRefine((data, ctx) => {
    if (data.source === "manual") {
      if (data.generation_id !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "generation_id must be null for manual source",
          path: ["generation_id"],
        });
      }
    } else {
      // source is "ai-full" or "ai-edited"
      if (typeof data.generation_id !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "generation_id must be a number for AI-generated flashcards",
          path: ["generation_id"],
        });
      }
    }
  });

export const createFlashcardsSchema = z.object({
  deck_name: z.string().min(1, "Deck name is required").max(100, "Deck name cannot exceed 100 characters"),
  flashcards: z // Changed from flashcardsProposals to flashcards
    .array(createFlashcardItemSchema) // Use the new refined item schema
    .min(1, "At least one flashcard is required") // Updated message
    .max(50, "Cannot create more than 50 flashcards at a time"),
});

export type CreateFlashcardsSchema = z.infer<typeof createFlashcardsSchema>;
