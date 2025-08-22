import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LearnSession, type FlashcardData } from "../../../src/components/LearnSession"; // Updated path for LearnSession and FlashcardData
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server.ts"; // Updated path for server

// Mock toast for notifications
vi.mock("../../src/lib/utils/toast", () => ({
  toast: vi.fn(),
}));

const mockFlashcards: FlashcardData[] = [
  {
    id: 1,
    front: "Question 1",
    back: "Answer 1",
    deck_name: "Test Deck",
    last_reviewed_at: null,
    difficulty_level: 0,
  },
  {
    id: 2,
    front: "Question 2",
    back: "Answer 2",
    deck_name: "Test Deck",
    last_reviewed_at: null,
    difficulty_level: 0,
  },
];

describe("LearnSession", () => {
  const mockOnBack = vi.fn();
  const deckId = 1;
  const deckName = "Test Deck";

  beforeEach(() => {
    // Reset mocks before each test
    mockOnBack.mockClear();
    vi.clearAllMocks();
  });

  // Test 1: Loading state and successful fetch
  test("should display loading state and then flashcards on successful fetch", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json(mockFlashcards, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    expect(screen.getByText(/Ładowanie fiszek z talii/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Pytanie")).toBeInTheDocument();
      expect(screen.getByText(mockFlashcards[0].front)).toBeInTheDocument();
      expect(screen.getByText(`Fiszka 1 z ${mockFlashcards.length}`)).toBeInTheDocument();
    });
  });

  // Test 2: Error state on failed fetch
  test("should display error message on failed flashcard fetch", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json({ error: "Failed to load" }, { status: 500 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Błąd ładowania fiszek/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Powrót/i));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  // Test 3: No flashcards message
  test("should display message when no flashcards are available", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json([], { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Brak fiszek do powtórek/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Wróć do wyboru talii/i));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  // Test 4: Flipping a flashcard
  test("should flip the flashcard on click", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json(mockFlashcards, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].front)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(mockFlashcards[0].front)); // Click to flip

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].back)).toBeInTheDocument();
      expect(screen.getByText(/Oceń trudność/i)).toBeInTheDocument();
    });
  });

  // Test 5: Selecting difficulty and moving to the next card
  test("should select difficulty and move to the next flashcard", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json(mockFlashcards, { status: 200 });
      }),
      http.post("/api/learn", () => {
        return HttpResponse.json({ success: true }, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].front)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(mockFlashcards[0].front)); // Flip card

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].back)).toBeInTheDocument();
    });

    // Select "Bardzo łatwo" difficulty
    fireEvent.click(screen.getByLabelText("Bardzo łatwo - fiszka pojawi się za bardzo długi czas"));

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[1].front)).toBeInTheDocument(); // Next card front
      expect(screen.getByText(`Fiszka 2 z ${mockFlashcards.length}`)).toBeInTheDocument();
    });
  });

  // Test 6: Completing the session
  test("should display session complete screen after all flashcards are reviewed", async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json([mockFlashcards[0]], { status: 200 }); // Only one card
      }),
      http.post("/api/learn", () => {
        return HttpResponse.json({ success: true }, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].front)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(mockFlashcards[0].front)); // Flip card

    await waitFor(() => {
      expect(screen.getByText(mockFlashcards[0].back)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Bardzo łatwo - fiszka pojawi się za bardzo długi czas"));

    await waitFor(() => {
      expect(screen.getByText(/Sesja ukończona!/i)).toBeInTheDocument();
      expect(screen.getByText(/Gratulacje! Ukończyłeś sesję powtórek z 1 fiszkami./i)).toBeInTheDocument();
    });
  });

  // Test 7: Restarting the session
  test('should restart the session when "Powtórz sesję" is clicked', async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json([mockFlashcards[0]], { status: 200 }); // Only one card
      }),
      http.post("/api/learn", () => {
        return HttpResponse.json({ success: true }, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(mockFlashcards[0].front));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByLabelText("Bardzo łatwo - fiszka pojawi się za bardzo długi czas"));
    });
    await waitFor(() => {
      expect(screen.getByText(/Sesja ukończona!/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Powtórz sesję/i));

    await waitFor(() => {
      expect(screen.getByText("Pytanie")).toBeInTheDocument();
      expect(screen.getByText(mockFlashcards[0].front)).toBeInTheDocument();
      expect(screen.getByText(`Fiszka 1 z 1`)).toBeInTheDocument();
    });
  });

  // Test 8: Calling onBack when "Powrót" button in header is clicked
  test('should call onBack when "Powrót" button in header is clicked', async () => {
    server.use(
      http.get(`/api/learn?deckId=${deckId}`, () => {
        return HttpResponse.json(mockFlashcards, { status: 200 });
      })
    );

    render(<LearnSession deckId={deckId} deckName={deckName} onBack={mockOnBack} />);

    await waitFor(() => {
      // Find the 'Powrót' button by its accessible name (text content or aria-label)
      const backButton = screen.getByRole("button", { name: /Powrót/i });
      expect(backButton).toBeInTheDocument();
      fireEvent.click(backButton);
    });

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
