// Mock data factories for testing

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides
})

export const createMockDeck = (overrides = {}) => ({
  id: '1',
  name: 'Test Deck',
  description: 'A test deck for testing purposes',
  user_id: '1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  flashcards_count: 5,
  ...overrides
})

export const createMockFlashcard = (overrides = {}) => ({
  id: '1',
  front: 'What is React?',
  back: 'A JavaScript library for building user interfaces',
  deck_id: '1',
  user_id: '1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  difficulty: 0,
  interval: 1,
  repetition: 0,
  ef_factor: 2.5,
  next_review: '2024-01-02T00:00:00.000Z',
  last_reviewed: null,
  ...overrides
})

export const createMockGeneration = (overrides = {}) => ({
  id: '1',
  user_id: '1',
  source_text: 'React is a JavaScript library',
  model: 'gpt-3.5-turbo',
  created_at: '2024-01-01T00:00:00.000Z',
  proposals: [
    {
      front: 'What is React?',
      back: 'A JavaScript library for building user interfaces'
    },
    {
      front: 'What language is React written in?',
      back: 'JavaScript'
    }
  ],
  ...overrides
})
