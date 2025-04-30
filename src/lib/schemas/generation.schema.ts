import { z } from "zod";

/**
 * Schema for validating generation request payload
 */
export const createGenerationSchema = z.object({
  model: z.string().min(1, "Model name is required"),
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text cannot exceed 10000 characters"),
});

/**
 * Type inference from the schema
 */
export type CreateGenerationSchema = z.infer<typeof createGenerationSchema>;
