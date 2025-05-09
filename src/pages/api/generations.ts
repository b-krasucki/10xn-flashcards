import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../lib/schemas/generation.schema";
import { LLMService, LLMError } from "../../lib/services/llmService";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import type { SupabaseClient } from "../../db/supabase.client";
import crypto from "crypto";

export const prerender = false;

/**
 * POST /generations - Inicjuje generowanie fiszek z tekstu źródłowego
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parsowanie i walidacja body żądania
    const body = await request.json();
    const validationResult = createGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Błąd walidacji",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const { model, source_text } = validationResult.data;
    const start = Date.now();

    // Obliczanie metryki tekstu (używamy MD5)
    const source_text_hash = crypto.createHash("md5").update(source_text).digest("hex");
    const source_text_lenght = source_text.length;

    // Generowanie fiszek przy użyciu LLM
    const llmService = LLMService.getInstance();
    const proposals = await llmService.generateFlashcards(model, source_text);

    // Generowanie nazwy talii
    let deckName = `Generated Deck for ${source_text_hash.substring(0, 8)}`; // Fallback name
    try {
      deckName = await llmService.generateDeckName(model, source_text);
    } catch (nameGenError) {
      console.error("Failed to generate deck name, using fallback:", nameGenError);
    }

    const generation_duration = Date.now() - start;

    // Zapis rekordu generacji do bazy
    const { data: generation, error: dbError } = await (locals.supabase as SupabaseClient)
      .from("generations")
      .insert({
        user_id: DEFAULT_USER_ID,
        model,
        generated_count: proposals.length,
        source_text_hash,
        source_text_lenght,
        generation_duration,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error during generation insert:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!generation) {
      console.error("No generation data returned after insert");
      throw new Error("Failed to create generation record");
    }

    return new Response(
      JSON.stringify({
        generation_id: generation.id,
        generated_count: proposals.length,
        proposals,
        deckName,
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Błąd generacji:", error);

    // Logowanie błędu LLM
    if (error instanceof LLMError) {
      await (locals.supabase as SupabaseClient).from("generation_error_logs").insert({
        user_id: DEFAULT_USER_ID,
        model: "unknown",
        source_text_hash: "",
        source_text_lenght: 0,
        error_code: error.code,
        error_message: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Błąd serwisu LLM",
          details: error.message,
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Błąd wewnętrzny serwera",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
};
