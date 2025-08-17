import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock API endpoints
  http.get("/api/user", () => {
    return HttpResponse.json({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  }),

  http.get("/api/decks", () => {
    return HttpResponse.json([
      {
        id: "1",
        name: "Test Deck",
        description: "A test deck for testing purposes",
        created_at: "2024-01-01T00:00:00.000Z",
        flashcards_count: 5,
      },
    ]);
  }),

  http.get("/api/flashcards", () => {
    return HttpResponse.json([
      {
        id: "1",
        front: "What is React?",
        back: "A JavaScript library for building user interfaces",
        deck_id: "1",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
  }),

  // Mock authentication endpoints
  http.post("/api/auth/signin", () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: "1",
        email: "test@example.com",
      },
    });
  }),

  http.post("/api/auth/signout", () => {
    return HttpResponse.json({ success: true });
  }),

  // Mock generation endpoints
  http.post("/api/generations", () => {
    return HttpResponse.json({
      id: "1",
      proposals: [
        {
          front: "Generated question 1?",
          back: "Generated answer 1",
        },
        {
          front: "Generated question 2?",
          back: "Generated answer 2",
        },
      ],
    });
  }),
];
