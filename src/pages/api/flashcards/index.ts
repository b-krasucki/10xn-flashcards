import type { APIRoute } from "astro";
import { createFlashcardsSchema } from "../../../lib/schemas/flashcards.schema";
import type { CreateFlashcardsCommandDto, ErrorResponseDto } from "../../../types";
import { FlashcardsService } from "../../../lib/services/flashcards.service";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export const prerender = false;

// Initialize Supabase client
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
const testUserId = import.meta.env.TEST_USER;

if (!supabaseUrl || !supabaseAnonKey || !testUserId) {
  throw new Error("Missing required environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, or TEST_USER)");
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Initialize service
const flashcardsService = new FlashcardsService(supabase);

export const POST: APIRoute = async ({ request }) => {
  // Using test user ID from environment variables
  const userId = testUserId;

  // 1. Parse and validate JSON
  let commandDto: CreateFlashcardsCommandDto;
  try {
    const body = await request.json();
    const validationResult = createFlashcardsSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.flatten(),
        } as ErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    commandDto = validationResult.data;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON format" } as ErrorResponseDto), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 3. Call service to create flashcards
    const result = await flashcardsService.createFlashcards(userId, commandDto.deck_name, commandDto.flashcards);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error creating flashcards:", error);

    let status = 500;
    let errorMessage = "Internal Server Error";

    if (error instanceof Error) {
      errorMessage = error.message;
      // Map specific error messages to status codes
      if (errorMessage.includes("not found")) {
        status = 404;
      } else if (errorMessage.includes("Unauthorized") || errorMessage.includes("not allowed")) {
        status = 403;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: error instanceof Error ? error.cause : undefined,
      } as ErrorResponseDto),
      {
        status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
