import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Book, ChevronRight } from "lucide-react";

interface Deck {
  id: number;
  deck_name: string;
  flashcard_count: number;
  created_at: string;
}

interface DeckSelectorProps {
  onDeckSelected: (deckId: number, deckName: string) => void;
}

export const DeckSelector: React.FC<DeckSelectorProps> = ({ onDeckSelected }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/decks');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Extract decks array from response and filter out decks with no flashcards
        const decksList = data.decks || [];
        const decksWithFlashcards = decksList.filter((deck: Deck) => deck.flashcard_count > 0);
        setDecks(decksWithFlashcards);
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load decks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDecks();
  }, []);

  const handleDeckSelect = (deck: Deck) => {
    onDeckSelected(deck.id, deck.deck_name);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Ładowanie talii...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Błąd podczas ładowania talii: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (decks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak dostępnych talii</CardTitle>
          <CardDescription>
            Nie masz jeszcze żadnych talii z fiszkami. Stwórz fiszki, aby móc rozpocząć sesję powtórek.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/generate'}>
            Generuj nowe fiszki
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Wybierz talię do nauki</h2>
        <p className="text-muted-foreground">
          Wybierz talię, z której chcesz powtarzać fiszki
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <Card 
            key={deck.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => handleDeckSelect(deck)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Book className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg leading-tight">
                    {deck.deck_name}
                  </CardTitle>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {deck.flashcard_count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {deck.flashcard_count === 1 ? 'fiszka' : 'fiszek'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Utworzona {new Date(deck.created_at).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/flashcards'}
          className="mt-4"
        >
          Wróć do zarządzania talii
        </Button>
      </div>
    </div>
  );
};
