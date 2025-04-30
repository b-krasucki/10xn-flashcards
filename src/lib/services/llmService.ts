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
              content: `Create flashcards from the following text:\n\n${sourceText}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new LLMError(`API request failed with status ${response.status}`, "API_ERROR");
      }

      const data = await response.json();

      // Transform the LLM response into flashcard proposals
      // This is a simplified example - you'd need to parse the actual response format
      return data.choices[0].message.content
        .split("\n")
        .filter(Boolean)
        .map((card: string) => ({
          front: card.split(" | ")[0],
          back: card.split(" | ")[1],
          source: "ai-full" as const,
        }));
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(error instanceof Error ? error.message : "Unknown error occurred", "UNKNOWN_ERROR");
    }
  }
}
