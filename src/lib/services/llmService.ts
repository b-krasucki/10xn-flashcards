import type { GenerationProposalItemDto } from "../../types";

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

  private constructor(apiKey?: string) {
    // If apiKey is provided directly, use it (for Cloudflare Workers env)
    if (apiKey) {
      this.apiKey = apiKey;
      return;
    }

    // Fallback: Support both import.meta.env (Astro/Vite) and process.env (Node.js/local)
    const envApiKey = 
      (typeof import.meta !== "undefined" && import.meta.env?.OPENROUTER_API_KEY) || 
      process.env.OPENROUTER_API_KEY;
    
    console.log("OpenRouter API Key:", envApiKey ? "Key exists" : "Key is missing");
    if (!envApiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    this.apiKey = envApiKey;
  }

  public static getInstance(apiKey?: string): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(apiKey);
    }
    return LLMService.instance;
  }

  /**
   * Extracts deck name from reasoning text for models that provide thinking process
   * @param reasoning - The reasoning text from the model
   * @returns Extracted deck name or null if not found
   */
  private extractDeckNameFromReasoning(reasoning: string): string | null {
    // Look for quoted deck names in the reasoning - focus on Polish names that look like deck titles
    const quotedPatterns = [
      /"([^"]{10,80})"/g, // Text in quotes - expanded range for Polish titles
      /'([^']{10,80})'/g, // Text in single quotes
    ];

    const foundNames: string[] = [];

    for (const pattern of quotedPatterns) {
      let match;
      while ((match = pattern.exec(reasoning)) !== null) {
        const candidate = match[1].trim();
        // Look for Polish deck-like names (containing key tech words)
        const techKeywords = /(?:AI|architektura|projekt|trendy|produktywność|programowanie|technolog|metod)/i;
        const avoidPhrases =
          /^(that's|words|final|suggestion|response|text|content|polish|english|trends in ai|discovering ai)$/i;

        if (
          techKeywords.test(candidate) &&
          !avoidPhrases.test(candidate) &&
          candidate.length >= 10 &&
          candidate.length <= 80
        ) {
          foundNames.push(candidate);
        }
      }
    }

    // If we found tech-related quoted names, return the best one (shortest and most focused)
    if (foundNames.length > 0) {
      console.log("Found potential deck names in quotes:", foundNames);
      // Sort by length and return the shortest (usually most concise)
      // But prefer names that are 5-12 words (typical deck name range)
      const wordCountSort = foundNames.sort((a, b) => {
        const wordsA = a.split(/\s+/).length;
        const wordsB = b.split(/\s+/).length;

        // Prefer names with 5-12 words
        const isOptimalA = wordsA >= 5 && wordsA <= 12;
        const isOptimalB = wordsB >= 5 && wordsB <= 12;

        if (isOptimalA && !isOptimalB) return -1;
        if (!isOptimalA && isOptimalB) return 1;

        // If both or neither are optimal, prefer shorter
        return a.length - b.length;
      });

      const bestName = wordCountSort[0];
      console.log("Selected best deck name:", bestName);
      return bestName;
    }

    // Look for specific patterns from reasoning (both grok and qwen formats)
    const specificPatterns = [
      /Possible name:\s*["']([^"']{10,80})["']/gi,
      /Final suggestion:\s*["']?([^"\n]{10,80})["']?/gi,
      /(?:brainstorming|suggestion).*?["']([^"']{10,80})["']/gi,
      // Qwen format: "name" – that's X words
      /["']([^"']{10,80})["']\s*[–-]\s*that's\s+\d+\s+words?/gi,
      // Other qwen patterns
      /Maybe\s+["']([^"']{10,80})["']/gi,
      /How about\s+["']([^"']{10,80})["']/gi,
      /Or\s+["']([^"']{10,80})["']/gi,
    ];

    // Collect all matches from specific patterns
    const specificMatches: string[] = [];
    for (const pattern of specificPatterns) {
      const matches = Array.from(reasoning.matchAll(pattern));
      for (const match of matches) {
        if (match[1]) {
          const candidate = match[1].trim().replace(/[".'–]+$/, "");
          if (candidate.length >= 10 && candidate.length <= 80) {
            specificMatches.push(candidate);
          }
        }
      }
    }

    if (specificMatches.length > 0) {
      console.log("Found deck names with specific patterns:", specificMatches);
      // Return the last one (usually the final suggestion)
      const bestSpecific = specificMatches[specificMatches.length - 1];
      console.log("Selected best specific pattern name:", bestSpecific);
      return bestSpecific;
    }

    // Last resort: look for any Polish-looking tech title
    const polishTechPattern = /(?:AI|Architektura|Projekt|Trendy|Produktywność)[^.\n]{10,60}/gi;
    const matches = reasoning.match(polishTechPattern);
    if (matches && matches.length > 0) {
      const candidate = matches[matches.length - 1].trim();
      console.log("Found Polish tech pattern:", candidate);
      return candidate;
    }

    return null;
  }

  /**
   * Generates flashcard proposals using the specified LLM model
   * @param model - The name of the LLM model to use
   * @param sourceText - The source text to generate flashcards from
   * @returns Array of generated flashcard proposals
   * @throws LLMError if the API call fails
   */
  public async generateFlashcards(model: string, sourceText: string): Promise<GenerationProposalItemDto[]> {
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
      const message = data.choices[0]?.message;
      let rawContent = message?.content;

      // Some models (like qwen) put content in 'reasoning' field instead of 'content'
      if (!rawContent && message?.reasoning) {
        console.log("Content field is empty, trying reasoning field for model:", model);
        rawContent = message.reasoning;
      }

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
        .filter(
          (proposal: GenerationProposalItemDto | null): proposal is GenerationProposalItemDto => proposal !== null
        ); // Filter out nulls and type guard // Return empty array if content is missing or no valid blocks found
    } catch (error) {
      console.error("LLM Service error:", error);
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(error instanceof Error ? error.message : "Unknown error occurred", "UNKNOWN_ERROR");
    }
  }

  /**
   * Generates a suggested deck name using the specified LLM model
   * @param model - The name of the LLM model to use
   * @param sourceText - The source text to generate the deck name from
   * @returns A suggested deck name string
   * @throws LLMError if the API call fails
   */
  public async generateDeckName(model: string, sourceText: string): Promise<string> {
    try {
      console.log("Making request to OpenRouter for deck name with model:", model);
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
                "You are a helpful assistant that suggests a concise and relevant deck name based on the provided text. The name should be short, ideally 5-12 words. Respond ONLY with the ONE suggested deck name, no explanations or other text.",
            },
            {
              role: "user",
              content: `Suggest a concise and relevant deck name (5-12 words) for the following text. Response should be in language of the source text. Respond ONLY with the ONE suggested deck name:\n\n${sourceText}`,
            },
          ],
          max_tokens: 500, // Limit response length for deck name
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API error (deck name):", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new LLMError(`API request failed with status ${response.status}: ${errorText}`, "API_ERROR");
      }

      const data = await response.json();
      console.log("OpenRouter response (deck name):", JSON.stringify(data, null, 2));

      const message = data.choices[0]?.message;
      let rawContent = message?.content;

      // Some models (like qwen, grok) put content in 'reasoning' field instead of 'content'
      if (!rawContent && message?.reasoning) {
        console.log("Content field is empty, trying reasoning field for model:", model);
        rawContent = message.reasoning;

        // For models that put reasoning instead of final answer, try to extract the actual deck name
        if (model.includes("grok") || model.includes("x-ai") || model.includes("qwen")) {
          console.log("Detected reasoning-based model, attempting to extract deck name from reasoning");
          const extractedName = this.extractDeckNameFromReasoning(rawContent);
          if (extractedName) {
            console.log("Successfully extracted deck name from reasoning:", extractedName);
            rawContent = extractedName;
          } else {
            console.log("Could not extract deck name from reasoning, using fallback parsing");
          }
        }
      }

      console.log("Raw deck name content from LLM:", JSON.stringify(rawContent));

      if (!rawContent) {
        console.error("LLM response does not contain content in either 'content' or 'reasoning' field:", data);
        throw new LLMError("LLM response missing content field", "PARSE_ERROR");
      }

      // More robust parsing - handle various formats
      let deckName = rawContent.trim();

      // Remove common prefixes that some LLMs might add
      const prefixPatterns = [
        /^(Deck Name:|Title:|Name:|Suggested Name:)\s*/i,
        /^"([^"]+)"$/, // Remove quotes
        /^'([^']+)'$/, // Remove single quotes
        /^\*\*([^*]+)\*\*$/, // Remove markdown bold
        /^`([^`]+)`$/, // Remove code backticks
      ];

      for (const pattern of prefixPatterns) {
        const match = deckName.match(pattern);
        if (match) {
          deckName = match[1] || match[0].replace(pattern, "").trim();
          break;
        }
      }

      // Final cleanup
      deckName = deckName.replace(/^["'`*]+|["'`*]+$/g, "").trim();

      // If deck name contains multiple sentences or lines, take only the first line/sentence
      const lines = deckName.split(/\n+/);
      if (lines.length > 1) {
        deckName = lines[0].trim();
        console.log("Multiple lines detected, using first line:", deckName);
      }

      // If still contains multiple sentences, take the first one
      const sentences = deckName.split(/[.!?]+/);
      if (sentences.length > 1 && sentences[0].trim().length >= 10) {
        deckName = sentences[0].trim();
        console.log("Multiple sentences detected, using first sentence:", deckName);
      }

      console.log("Processed deck name:", JSON.stringify(deckName));

      if (!deckName || deckName.length === 0) {
        console.error("After processing, deck name is empty. Original content:", rawContent);
        throw new LLMError("Failed to extract valid deck name from LLM response", "PARSE_ERROR");
      }

      // Limit length to reasonable size for deck name
      if (deckName.length > 80) {
        deckName = deckName.substring(0, 77) + "...";
      }

      // Ensure it's a single title, not a list
      if (deckName.includes("\n") || deckName.includes("•") || deckName.includes("-")) {
        const cleanTitle = deckName.split(/[\n•-]/)[0].trim();
        if (cleanTitle.length >= 10) {
          deckName = cleanTitle;
          console.log("Cleaned list format to single title:", deckName);
        }
      }

      return deckName;
    } catch (error) {
      console.error("LLM Service error (deck name):", error);
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(error instanceof Error ? error.message : "Unknown error occurred", "UNKNOWN_ERROR");
    }
  }
}
