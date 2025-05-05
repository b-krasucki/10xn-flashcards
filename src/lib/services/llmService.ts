import type { GenerationProposalDto } from "../../types";

export class LLMError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "LLMError";
  }
}

export class LLMService {
  private static instance: LLMService;
  private readonly apiKey: string;

  private constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    console.log("OpenRouter API Key:", apiKey ? "Key exists" : "Key is missing");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  public static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Generates flashcard proposals using the specified LLM model
   * @param model - The name of the LLM model to use
   * @param sourceText - The source text to generate flashcards from
   * @returns Array of generated flashcard proposals
   * @throws LLMError if the API call fails
   */
  public async generateFlashcards(model: string, sourceText: string): Promise<GenerationProposalDto[]> {
    try {
      console.log("Making request to OpenRouter with model:", model);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that creates flashcards from text. Generate concise, clear flashcards with questions on the front and answers on the back.",
            },
            {
              role: "user",
              content: `You are a helpful assistant that creates flashcards from text. Generate concise, clear flashcards with questions on the front and answers on the back. Response should be in language of the source text in format "Front: question" and "Back: answer" for each flashcard. No other text should be included. \n\n${sourceText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new LLMError(`API request failed with status ${response.status}: ${errorText}`, "API_ERROR");
      }

      const data = await response.json();
      console.log("OpenRouter response:", data);

      // Log the raw content from LLM for debugging parsing
      const rawContent = data.choices[0]?.message?.content;
      console.log("Raw LLM Content:\n---", rawContent, "\n---");

      // Transform the LLM response into flashcard proposals
      return rawContent
        ?.split("\n\n") // Split into blocks based on double newline
        .map((block: string) => {
          const lines = block.trim().split("\n");
          let front = "";
          let back = "";

          lines.forEach((line) => {
            if (line.startsWith("Front:")) {
              front = line.substring("Front:".length).trim();
            } else if (line.startsWith("Back:")) {
              back = line.substring("Back:".length).trim();
            }
          });

          if (front && back) {
            // Only return if both front and back are found
            return {
              front,
              back,
              source: "ai-full" as const,
            };
          }
          return null; // Return null for invalid blocks
        })
        .filter((proposal: GenerationProposalDto | null): proposal is GenerationProposalDto => proposal !== null); // Filter out nulls and type guard // Return empty array if content is missing or no valid blocks found
    } catch (error) {
      console.error("LLM Service error:", error);
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(error instanceof Error ? error.message : "Unknown error occurred", "UNKNOWN_ERROR");
    }
  }
}
