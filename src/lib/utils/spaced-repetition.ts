/**
 * Spaced Repetition Algorithm Implementation (SM-2)
 * Based on the SM-2 algorithm by Piotr Wozniak
 *
 * Difficulty levels mapping:
 * 1 = Very Easy (perfect response)
 * 2 = Easy (correct response with hesitation)
 * 3 = Medium (correct response with serious difficulty)
 * 4 = Hard (incorrect response but remembered when shown answer)
 * 5 = Very Hard (complete blackout)
 */

export interface SpacedRepetitionResult {
  nextReviewDate: Date;
  easeFactor: number;
  reviewCount: number;
  interval: number; // days until next review
}

export interface FlashcardReviewData {
  easeFactor: number;
  reviewCount: number;
  lastReviewedAt: Date | null;
}

/**
 * Calculate the next review date based on SM-2 algorithm
 * @param difficulty User-rated difficulty (1-5, where 1 is easiest)
 * @param currentData Current flashcard review data
 * @returns Updated spaced repetition data
 */
export function calculateNextReview(difficulty: number, currentData: FlashcardReviewData): SpacedRepetitionResult {
  // Validate input
  if (difficulty < 1 || difficulty > 5) {
    throw new Error("Difficulty must be between 1 and 5");
  }

  let { easeFactor, reviewCount } = currentData;
  const newReviewCount = reviewCount + 1;

  // SM-2 algorithm: Update ease factor based on difficulty
  // quality in SM-2 is 0-5, but we use 1-5, so we need to adjust
  const quality = 6 - difficulty; // Convert to SM-2 quality (5=easiest, 1=hardest)

  // Calculate new ease factor
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Calculate interval (days until next review)
  let interval: number;

  if (quality < 3) {
    // If quality is poor (difficulty 4-5), reset to beginning
    interval = 1;
  } else {
    // Good quality response
    if (newReviewCount === 1) {
      interval = 1; // First review: 1 day
    } else if (newReviewCount === 2) {
      interval = 6; // Second review: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by ease factor
      const previousInterval = calculatePreviousInterval(newReviewCount - 1, newEaseFactor);
      interval = Math.round(previousInterval * newEaseFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    nextReviewDate,
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
    reviewCount: newReviewCount,
    interval,
  };
}

/**
 * Calculate what the previous interval was for a given review count and ease factor
 * This is used to calculate the next interval in the SM-2 algorithm
 */
function calculatePreviousInterval(reviewCount: number, easeFactor: number): number {
  if (reviewCount === 1) return 1;
  if (reviewCount === 2) return 6;

  // For review count > 2, work backwards
  let interval = 6;
  for (let i = 3; i <= reviewCount; i++) {
    interval = Math.round(interval * easeFactor);
  }
  return interval;
}

/**
 * Check if a flashcard is due for review
 * @param nextReviewDate The scheduled next review date
 * @param currentDate Current date (defaults to now)
 * @returns true if the card is due for review
 */
export function isCardDue(nextReviewDate: Date | null, currentDate: Date = new Date()): boolean {
  if (!nextReviewDate) return true; // Never reviewed cards are always due
  return currentDate >= nextReviewDate;
}

/**
 * Get cards that are due for review from a list of flashcards
 * @param flashcards Array of flashcards with review data
 * @param currentDate Current date (defaults to now)
 * @returns Array of flashcards due for review
 */
export function getCardsDueForReview<T extends { next_review_date: string | null }>(
  flashcards: T[],
  currentDate: Date = new Date()
): T[] {
  return flashcards.filter((card) => {
    const nextReviewDate = card.next_review_date ? new Date(card.next_review_date) : null;
    return isCardDue(nextReviewDate, currentDate);
  });
}

/**
 * Convert difficulty level to human-readable text
 */
export function difficultyToText(difficulty: number): string {
  const difficultyMap: Record<number, string> = {
    1: "Bardzo łatwo",
    2: "Łatwo",
    3: "Średnio",
    4: "Trudno",
    5: "Bardzo trudno",
  };
  return difficultyMap[difficulty] || "Nieznane";
}

/**
 * Get recommended study session size based on available cards
 * @param totalDueCards Total number of cards due for review
 * @returns Recommended number of cards for this session
 */
export function getRecommendedSessionSize(totalDueCards: number): number {
  if (totalDueCards <= 10) return totalDueCards;
  if (totalDueCards <= 20) return 15;
  if (totalDueCards <= 50) return 20;
  return 25; // Max session size
}
