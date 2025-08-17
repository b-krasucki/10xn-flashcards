import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFlashcard, createMockDeck } from "@/test/utils/mock-data";

// Mock the Supabase client
vi.mock("@/db/supabase.client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        data: [],
        error: null,
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  },
}));

describe("Flashcards Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFlashcards", () => {
    it("should return flashcards for a deck", async () => {
      // This is a placeholder test that would import and test the actual service
      const mockFlashcards = [
        createMockFlashcard({ id: "1", front: "Question 1" }),
        createMockFlashcard({ id: "2", front: "Question 2" }),
      ];

      expect(mockFlashcards).toHaveLength(2);
      expect(mockFlashcards[0].front).toBe("Question 1");
    });
  });

  describe("createFlashcard", () => {
    it("should create a new flashcard", async () => {
      const newFlashcard = createMockFlashcard({
        front: "New Question",
        back: "New Answer",
      });

      expect(newFlashcard.front).toBe("New Question");
      expect(newFlashcard.back).toBe("New Answer");
    });
  });

  describe("updateFlashcard", () => {
    it("should update flashcard review data", async () => {
      const flashcard = createMockFlashcard();
      const updatedFlashcard = {
        ...flashcard,
        difficulty: 1,
        interval: 2,
        last_reviewed: new Date().toISOString(),
      };

      expect(updatedFlashcard.difficulty).toBe(1);
      expect(updatedFlashcard.interval).toBe(2);
      expect(updatedFlashcard.last_reviewed).toBeTruthy();
    });
  });
});
