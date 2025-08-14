import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/utils/toast";
import { ArrowLeft } from "lucide-react";

interface FlashcardData {
  id: number;
  front: string;
  back: string;
  deck_name: string;
  last_reviewed_at: string | null;
  difficulty_level: number;
}

interface LearnSessionProps {
  deckId: number;
  deckName: string;
  onBack: () => void;
}

interface FlipCardProps {
  flashcard: FlashcardData;
  isFlipped: boolean;
  onFlip: () => void;
}

const FlipCard: React.FC<FlipCardProps> = ({ flashcard, isFlipped, onFlip }) => {
  return (
    <div 
      className="flip-card w-full max-w-lg mx-auto cursor-pointer"
      onClick={onFlip}
    >
      <div 
        className={`flip-card-inner relative w-full h-64 ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of card */}
        <Card className="flip-card-front">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              {flashcard.deck_name && (
                <span className="text-sm text-muted-foreground font-normal block mb-2">
                  {flashcard.deck_name}
                </span>
              )}
              Pytanie
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-lg text-center font-medium">
              {flashcard.front}
            </p>
          </CardContent>
          <div className="px-6 pb-6">
            <p className="text-sm text-muted-foreground text-center">
              Kliknij, aby zobaczyć odpowiedź
            </p>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="flip-card-back">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">
              {flashcard.deck_name && (
                <span className="text-sm text-muted-foreground font-normal block mb-2">
                  {flashcard.deck_name}
                </span>
              )}
              Odpowiedź
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-base text-center">
              {flashcard.back}
            </p>
          </CardContent>
          <div className="px-6 pb-6">
            <p className="text-sm text-muted-foreground text-center">
              Jak dobrze znasz tę odpowiedź?
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ProgressIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full max-w-lg mx-auto mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Fiszka {current} z {total}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

type Difficulty = 'very_easy' | 'easy' | 'medium' | 'hard' | 'very_hard';

export const LearnSession: React.FC<LearnSessionProps> = ({ deckId, deckName, onBack }) => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load flashcards from the selected deck
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/learn?deckId=${deckId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setFlashcards(data);
      } catch (err) {
        console.error('Error fetching flashcards for learning:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flashcards');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [deckId]);

  const currentFlashcard = flashcards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDifficultySelect = async (difficulty: Difficulty) => {
    if (!currentFlashcard) return;

    // Convert difficulty to numeric value for API (1-5 scale)
    const difficultyValue = {
      very_easy: 1,  // Very Easy (1/5)
      easy: 2,       // Easy (2/5)
      medium: 3,     // Medium (3/5)
      hard: 4,       // Hard (4/5)
      very_hard: 5   // Very Hard (5/5)
    }[difficulty];

    try {
      const response = await fetch('/api/learn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flashcardId: currentFlashcard.id,
          difficulty: difficultyValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to save review');
      }
      
      const difficultyText = {
        very_easy: "Bardzo łatwo",
        easy: "Łatwo",
        medium: "Średnio", 
        hard: "Trudno",
        very_hard: "Bardzo trudno"
      };

      toast({
        title: "Odpowiedź zapisana",
        description: `Oceniono jako: ${difficultyText[difficulty]}`,
        variant: "success",
      });

      // Move to next card or complete session
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('Error saving difficulty rating:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania odpowiedzi",
        variant: "destructive",
      });
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionComplete(false);
  };

  const handleBackToFlashcards = () => {
    window.location.href = '/flashcards';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Błąd ładowania fiszek</CardTitle>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </div>
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack}>
            Wróć do wyboru talii
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ładowanie...</CardTitle>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Ładowanie fiszek z talii "{deckName}"...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak fiszek do powtórek</CardTitle>
          <CardDescription>
            Nie ma fiszek zaplanowanych do powtórki w tym czasie. Wróć później lub dodaj nowe fiszki.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackToFlashcards}>
            Wróć do fiszek
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (sessionComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesja ukończona!</CardTitle>
          <CardDescription>
            Gratulacje! Ukończyłeś sesję powtórek z {flashcards.length} fiszkami.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-muted-foreground">
              Następna sesja będzie dostępna zgodnie z algorytmem powtórek rozłożonych w czasie.
            </p>
          </div>
          <div className="flex space-x-2 justify-center">
            <Button onClick={handleRestartSession} variant="outline">
              Powtórz sesję
            </Button>
            <Button onClick={handleBackToFlashcards}>
              Wróć do fiszek
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sesja powtórek: {deckName}</CardTitle>
              <CardDescription>
                Powtarzanie fiszek z wybranej talii
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
          </div>
        </CardHeader>
      </Card>

      <ProgressIndicator 
        current={currentIndex + 1} 
        total={flashcards.length} 
      />

      <FlipCard
        flashcard={currentFlashcard}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      {isFlipped && (
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Oceń trudność</CardTitle>
              <CardDescription className="text-center">
                Jak trudna była ta fiszka?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Button
                  onClick={() => handleDifficultySelect('very_easy')}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 h-auto py-3 px-2 text-sm whitespace-normal"
                  aria-label="Bardzo łatwo - fiszka pojawi się za bardzo długi czas"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">😊</div>
                    <div>Bardzo łatwo</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleDifficultySelect('easy')}
                  variant="default"
                  className="bg-green-500 hover:bg-green-600 text-white border-green-500 h-auto py-3 px-2 text-sm whitespace-normal"
                  aria-label="Łatwo - fiszka pojawi się za długi czas"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">🙂</div>
                    <div>Łatwo</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleDifficultySelect('medium')}
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 h-auto py-3 px-2 text-sm whitespace-normal"
                  aria-label="Średnio - normalne interwały powtórek"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">😐</div>
                    <div>Średnio</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleDifficultySelect('hard')}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 h-auto py-3 px-2 text-sm whitespace-normal"
                  aria-label="Trudno - fiszka pojawi się wcześniej"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">😕</div>
                    <div>Trudno</div>
                  </div>
                </Button>
                <Button
                  onClick={() => handleDifficultySelect('very_hard')}
                  variant="destructive"
                  className="bg-red-700 hover:bg-red-800 h-auto py-3 px-2 text-sm whitespace-normal"
                  aria-label="Bardzo trudno - fiszka zostanie zresetowana"
                >
                  <div className="text-center">
                    <div className="text-lg mb-1">😰</div>
                    <div>Bardzo trudno</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
