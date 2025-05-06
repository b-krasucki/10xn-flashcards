import type { APIRoute } from "astro";
import { LLMService, LLMError } from "@/lib/services/llmService";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { sourceText } = body;

    if (!sourceText || typeof sourceText !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid sourceText" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use a default model or allow the client to specify one
    const selectedModel = "google/gemini-2.5-flash-preview"; // Use model from request or fallback to default

    const llmService = LLMService.getInstance();
    const deckName = await llmService.generateDeckName(selectedModel, sourceText);

    return new Response(JSON.stringify({ deckName }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error generating deck name:", error);
    let statusCode = 500;
    let errorMessage = "Internal Server Error";

    if (error instanceof LLMError) {
      errorMessage = error.message;
      // Optionally map LLMError codes to HTTP status codes
      if (error.code === "API_ERROR") {
        statusCode = 502; // Bad Gateway if LLM API fails
      } else if (error.code === "PARSE_ERROR") {
        statusCode = 500;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
