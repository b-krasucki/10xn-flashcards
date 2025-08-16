import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/lib/utils/toast";
import { OverlayLoader } from "./OverlayLoader";
import { Edit2, Trash2 } from "lucide-react";

interface FlashcardData {
  id: number;
  front: string;
  back: string;
  source: "manual" | "ai-full" | "ai-edited";
  deck_name?: string;
  created_at: string;
  updated_at: string;
}

interface FlashcardItemProps {
  flashcard: FlashcardData;
  onEdit: (id: number, updatedFlashcard: Partial<FlashcardData>) => void;
  onDelete: (id: number) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(flashcard.front);
  const [editedBack, setEditedBack] = useState(flashcard.back);

  const handleSaveEdit = async () => {
    if (!editedFront.trim() || !editedBack.trim()) {
      toast({
        title: "Błąd",
        description: "Przód i tył fiszki nie mogą być puste",
        variant: "destructive",
      });
      return;
    }

    try {
      await onEdit(flashcard.id, {
        front: editedFront.trim(),
        back: editedBack.trim(),
        source: flashcard.source === "ai-full" ? "ai-edited" : flashcard.source,
      });
      setIsEditing(false);
      
      toast({
        title: "Sukces",
        description: "Fiszka została zaktualizowana",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas zapisywania fiszki",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedFront(flashcard.front);
    setEditedBack(flashcard.back);
    setIsEditing(false);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "manual": return "Ręczna";
      case "ai-full": return "AI";
      case "ai-edited": return "AI (edytowana)";
      default: return source;
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">Fiszka #{flashcard.id}</CardTitle>
            <CardDescription>
              {getSourceLabel(flashcard.source)} • 
              {flashcard.deck_name && ` ${flashcard.deck_name} • `}
              {new Date(flashcard.updated_at).toLocaleDateString("pl-PL")}
            </CardDescription>
          </div>
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
                aria-label="Edytuj fiszkę"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
                    aria-label="Usuń fiszkę"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usuń fiszkę</AlertDialogTitle>
                    <AlertDialogDescription>
                      Czy na pewno chcesz usunąć tę fiszkę? Ta akcja nie może być cofnięta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(flashcard.id)}>
                      Usuń
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`front-${flashcard.id}`}>Przód fiszki</Label>
              <Input
                id={`front-${flashcard.id}`}
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Pytanie lub termin"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {editedFront.length}/200 znaków
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`back-${flashcard.id}`}>Tył fiszki</Label>
              <Textarea
                id={`back-${flashcard.id}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Odpowiedź lub definicja"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {editedBack.length}/500 znaków
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSaveEdit} size="sm">
                Zapisz
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                Anuluj
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">Przód:</h4>
              <p className="text-sm bg-muted p-3 rounded">{flashcard.front}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Tył:</h4>
              <p className="text-sm bg-muted p-3 rounded">{flashcard.back}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const AddFlashcardForm: React.FC<{ onAdd: (flashcard: Omit<FlashcardData, 'id' | 'created_at' | 'updated_at'>) => void; onCancel: () => void; deckId?: string }> = ({ onAdd, onCancel, deckId }) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!front.trim() || !back.trim()) {
      toast({
        title: "Błąd",
        description: "Przód i tył fiszki nie mogą być puste",
        variant: "destructive",
      });
      return;
    }

    try {
      await onAdd({
        front: front.trim(),
        back: back.trim(),
        source: "manual",
      });
      
      setFront("");
      setBack("");
      onCancel();
      
      toast({
        title: "Sukces",
        description: "Nowa fiszka została dodana",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas dodawania fiszki",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dodaj nową fiszkę</CardTitle>
        <CardDescription>Utwórz fiszkę ręcznie</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-front">Przód fiszki</Label>
            <Input
              id="new-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Pytanie lub termin"
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {front.length}/200 znaków
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-back">Tył fiszki</Label>
            <Textarea
              id="new-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Odpowiedź lub definicja"
              rows={4}
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground">
              {back.length}/500 znaków
            </p>
          </div>
          <div className="flex space-x-2">
            <Button type="submit" size="sm">
              Dodaj fiszkę
            </Button>
            <Button type="button" onClick={onCancel} variant="outline" size="sm">
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

interface FlashcardsListProps {
  deckId?: string;
}

export const FlashcardsList: React.FC<FlashcardsListProps> = ({ deckId }) => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filterByGeneration, setFilterByGeneration] = useState<number | null>(null);
  const [deckName, setDeckName] = useState<string>('');

  // Check for generation filter in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const generationId = urlParams.get('generation');
    if (generationId) {
      setFilterByGeneration(parseInt(generationId, 10));
    }
  }, []);

  // Fetch flashcards from API
  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoading(true);
      try {
        let url = '/api/flashcards';
        const params = new URLSearchParams();
        
        if (filterByGeneration) {
          params.append('generation', filterByGeneration.toString());
        }
        
        if (deckId) {
          params.append('deck', deckId);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        console.log('Fetching flashcards from:', url);
        console.log('Filter by generation:', filterByGeneration);
        console.log('Filter by deck:', deckId);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          throw new Error(`Failed to fetch flashcards: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Flashcards data received:', data);
        setFlashcards(data.flashcards || []);
        
        // Set deck name from first flashcard if available, or fetch from decks API if empty
        if (data.flashcards && data.flashcards.length > 0 && deckId) {
          setDeckName(data.flashcards[0].deck_name || '');
        } else if (deckId && data.flashcards && data.flashcards.length === 0) {
          // If the deck is empty, try to get deck name from decks API
          try {
            const deckResponse = await fetch('/api/decks');
            if (deckResponse.ok) {
              const deckData = await deckResponse.json();
              const currentDeck = deckData.decks.find((deck: any) => deck.id === parseInt(deckId, 10));
              if (currentDeck) {
                setDeckName(currentDeck.deck_name);
              }
            }
          } catch (deckError) {
            console.error('Error fetching deck name:', deckError);
          }
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać fiszek",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFlashcards();
  }, [filterByGeneration, deckId]);

  const handleEditFlashcard = async (id: number, updatedData: Partial<FlashcardData>) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFlashcards(prev => 
      prev.map(flashcard => 
        flashcard.id === id 
          ? { ...flashcard, ...updatedData, updated_at: new Date().toISOString() }
          : flashcard
      )
    );
  };

  const handleDeleteFlashcard = async (id: number) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFlashcards(prev => prev.filter(flashcard => flashcard.id !== id));
    
    toast({
      title: "Sukces",
      description: "Fiszka została usunięta",
      variant: "success",
    });
  };

  const handleAddFlashcard = async (newFlashcard: Omit<FlashcardData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // If we have a deckId, we need to get the deck name first
      let deckNameToUse = deckName;
      
      if (deckId && !deckNameToUse) {
        // Fetch deck name from API
        const deckResponse = await fetch('/api/decks');
        if (deckResponse.ok) {
          const deckData = await deckResponse.json();
          const currentDeck = deckData.decks.find((deck: any) => deck.id === parseInt(deckId, 10));
          if (currentDeck) {
            deckNameToUse = currentDeck.deck_name;
            setDeckName(currentDeck.deck_name);
          }
        }
      }
      
      if (!deckNameToUse) {
        throw new Error('Nie można określić nazwy talii');
      }

      // Use the existing API endpoint
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deck_name: deckNameToUse,
          flashcards: [{
            front: newFlashcard.front,
            back: newFlashcard.back,
            source: newFlashcard.source,
            generation_id: null // Manual flashcards have no generation_id
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create flashcard');
      }

      const result = await response.json();
      
      // Add the newly created flashcard to our list
      if (result.flashcards && result.flashcards.length > 0) {
        const createdFlashcard = result.flashcards[0];
        const flashcardData: FlashcardData = {
          id: createdFlashcard.id,
          front: createdFlashcard.front,
          back: createdFlashcard.back,
          source: createdFlashcard.source,
          deck_name: result.deck.deck_name,
          created_at: createdFlashcard.created_at,
          updated_at: createdFlashcard.updated_at,
        };
        
        setFlashcards(prev => [flashcardData, ...prev]);
      }
      
    } catch (error) {
      console.error('Error adding flashcard:', error);
      throw error; // Re-throw so the form can handle the error
    }
  };

  const handleDeleteDeck = async () => {
    if (!deckId) return;
    
    try {
      const response = await fetch(`/api/decks?id=${deckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }

      toast({
        title: "Sukces",
        description: "Talia została usunięta",
        variant: "success",
      });
      
      // Redirect to all decks view
      window.location.href = '/flashcards';
    } catch (error) {
      console.error('Error deleting deck:', error);
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas usuwania talii",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <OverlayLoader isVisible={true} />;
  }

  if (flashcards.length === 0 && !isAddingNew) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak fiszek</CardTitle>
          <CardDescription>
            Nie masz jeszcze żadnych fiszek. Utwórz pierwszą fiszkę lub wygeneruj nowe przy użyciu AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => setIsAddingNew(true)} className="mr-2">
            Dodaj nową fiszkę
          </Button>
          <Button onClick={() => window.location.href = '/generate'} variant="outline">
            Generuj fiszki AI
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filtering info */}
      {!isAddingNew && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">
              Twoje fiszki ({flashcards.length})
            </h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>Zarządzaj swoimi fiszkami i taliniami</span>
              {filterByGeneration && (
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-medium">
                    Filtrowane według generacji #{filterByGeneration}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilterByGeneration(null);
                      window.history.replaceState({}, '', '/flashcards');
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Wyczyść filtr
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddingNew(true)}>
              Dodaj nową fiszkę
            </Button>
            {deckId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" aria-label="Usuń talię">
                    Usuń talię
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usuń talię</AlertDialogTitle>
                    <AlertDialogDescription>
                      Czy na pewno chcesz usunąć talię "{deckName || 'tę talię'}"? 
                      Wszystkie fiszki w tej talii zostaną również usunięte. 
                      Ta akcja nie może być cofnięta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDeck}>
                      Usuń talię
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}

      {/* Add New Flashcard Form */}
      {isAddingNew && (
        <AddFlashcardForm 
          onAdd={handleAddFlashcard}
          onCancel={() => setIsAddingNew(false)}
          deckId={deckId}
        />
      )}

      {/* Flashcards List */}
      <div className="grid gap-4">
        {flashcards.map((flashcard) => (
          <FlashcardItem
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={handleEditFlashcard}
            onDelete={handleDeleteFlashcard}
          />
        ))}
      </div>
    </div>
  );
};
