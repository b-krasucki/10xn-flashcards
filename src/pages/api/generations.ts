import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../lib/schemas/generation.schema";
import { LLMService, LLMError } from "../../lib/services/llmService";
import crypto from "crypto";

export const prerender = false;

/**
 * POST /generations - Initiates flashcard generation from source text
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Ensure user is authenticated
    const { user } = locals;
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const { model, source_text } = validationResult.data;
    const start = Date.now();

    // Calculate text metrics
    const source_text_hash = crypto.createHash("sha256").update(source_text).digest("hex");
    const source_text_length = source_text.length;

    // Generate flashcards using LLM
    const llmService = LLMService.getInstance();
    const proposals = await llmService.generateFlashcards(model, source_text);
    const generation_duration = Date.now() - start;

    // Insert generation record
    const { data: generation, error: dbError } = await locals.supabase
      .from("generations")
      .insert({
        user_id: user.id,
        model,
        generated_count: proposals.length,
        source_text_hash,
        source_text_length,
        generation_duration,
      })
      .select("id")
      .single();

    if (dbError || !generation) {
      throw new Error("Failed to save generation record");
    }

    return new Response(
      JSON.stringify({
        generation_id: generation.id,
        generated_count: proposals.length,
        proposals,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Generation error:", error);

    // Log error if it's an LLM error
    if (error instanceof LLMError) {
      await locals.supabase.from("generation_error_logs").insert({
        user_id: locals.user?.id,
        error_code: error.code,
        error_message: error.message,
      });

      return new Response(JSON.stringify({ error: "LLM service error" }), { status: 500 });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
