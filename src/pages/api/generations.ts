import type { APIRoute } from "astro";
import { createGenerationSchema } from "../../lib/schemas/generation.schema";
import { LLMService, LLMError } from "../../lib/services/llmService";
import type { SupabaseClient } from "../../db/supabase.client";
import crypto from "crypto";

export const prerender = false;

/**
 * POST /generations - Inicjuje generowanie fiszek z tekstu źródłowego
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Get Supabase client from middleware
  const supabase = locals.supabase;
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // Zmienne dostępne w scope catch
  let model = "unknown";
  let source_text = "";
  let source_text_hash = "";
  let source_text_lenght = 0;

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

    ({ model, source_text } = validationResult.data);
    const start = Date.now();

    // Obliczanie metryki tekstu (używamy MD5)
    source_text_hash = crypto.createHash("md5").update(source_text).digest("hex");
    source_text_lenght = source_text.length;

    // Generowanie fiszek przy użyciu LLM
    const llmService = LLMService.getInstance();
    const proposals = await llmService.generateFlashcards(model, source_text);

    // Generowanie nazwy talii
    let deckName = `Generated Deck ${new Date().toISOString().split("T")[0]} ${source_text_hash.substring(0, 6)}`; // Fallback name with date
    try {
      console.log(`Attempting to generate deck name using model: ${model}`);
      deckName = await llmService.generateDeckName(model, source_text);
      console.log(`Successfully generated deck name: "${deckName}"`);
    } catch (nameGenError) {
      console.error("Failed to generate deck name, using fallback:", nameGenError);
      console.error("Fallback deck name will be used:", deckName);

      // Log additional details for debugging specific model issues
      if (nameGenError instanceof LLMError) {
        console.error("LLM Error details - Code:", nameGenError.code, "Message:", nameGenError.message);

        // Log deck name generation error to database
        try {
          await (locals.supabase as SupabaseClient).from("generation_error_logs").insert({
            user_id: userId,
            model,
            source_text_hash,
            source_text_lenght,
            error_code: `DECK_NAME_${nameGenError.code}`, // Prefix to distinguish from main generation errors
            error_message: `Deck name generation failed: ${nameGenError.message}`,
          });
          console.log("Successfully logged deck name generation error to database");
        } catch (dbError) {
          console.error("Failed to log deck name generation error to database:", dbError);
        }
      }
    }

    const generation_duration = Date.now() - start;

    // Zapis rekordu generacji do bazy
    const { data: generation, error: dbError } = await (locals.supabase as SupabaseClient)
      .from("generations")
      .insert({
        user_id: userId,
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

    // Logowanie błędu LLM z prawdziwymi danymi
    if (error instanceof LLMError) {
      // Zapisz błąd do generation_error_logs
      await (locals.supabase as SupabaseClient).from("generation_error_logs").insert({
        user_id: userId,
        model,
        source_text_hash,
        source_text_lenght,
        error_code: error.code,
        error_message: error.message,
      });

      // Jeśli mamy dane wejściowe, spróbuj zapisać rekord generacji z błędem
      if (source_text && model !== "unknown") {
        try {
          await (locals.supabase as SupabaseClient).from("generations").insert({
            user_id: userId,
            model,
            generated_count: 0, // 0 bo nie udało się wygenerować
            source_text_hash,
            source_text_lenght,
            generation_duration: 0, // Nie ma czasu, bo się nie udało
          });
          console.log("Successfully saved failed generation record to database");
        } catch (dbError) {
          console.error("Failed to save generation record for failed LLM generation:", dbError);
        }
      }

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
