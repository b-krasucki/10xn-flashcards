import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Edit2, Trash2, Plus } from "lucide-react";

interface DeckData {
  id: number;
  deck_name: string;
  created_at: string;
  updated_at: string;
  flashcard_count: number;
}

interface DeckCardProps {
  deck: DeckData;
  onEdit: (id: number, newName: string) => void;
  onDelete: (id: number) => void;
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, onEdit, onDelete }) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on edit/delete buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    // Navigate to deck details with flashcards
    window.location.href = `/deck/${deck.id}`;
  };

  const handleEdit = async () => {
    const newName = prompt('Wprowadź nową nazwę talii:', deck.deck_name);
    
    if (newName === null) {
      // User cancelled
      return;
    }
    
    if (!newName.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa talii nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    try {
      await onEdit(deck.id, newName.trim());
      toast({
        title: "Sukces",
        description: "Nazwa talii została zaktualizowana",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas edycji talii",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(deck.id);
      toast({
        title: "Sukces",
        description: "Talia została usunięta",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas usuwania talii",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-sm">{deck.deck_name}</CardTitle>
            <CardDescription className="text-xs">
              {new Date(deck.updated_at).toLocaleDateString("pl-PL")}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              aria-label="Edytuj talię"
              onClick={handleEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  aria-label="Usuń talię"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usuń talię</AlertDialogTitle>
                  <AlertDialogDescription>
                    Czy na pewno chcesz usunąć talię "{deck.deck_name}"? 
                    Wszystkie fiszki w tej talii zostaną również usunięte. 
                    Ta akcja nie może być cofnięta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {deck.flashcard_count} {deck.flashcard_count === 1 ? 'fiszka' : 'fiszek'}
          </span>
          <span className="text-xs text-muted-foreground">
            ID: {deck.id}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Kliknij, aby zobaczyć fiszki
        </p>
      </CardContent>
    </Card>
  );
};

const CreateDeckCard: React.FC<{ onCreate: (name: string) => void }> = ({ onCreate }) => {
  const handleCreate = async () => {
    const newName = prompt('Wprowadź nazwę dla nowej talii fiszek:', '');
    
    if (newName === null) {
      // User cancelled
      return;
    }
    
    if (!newName.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa talii nie może być pusta",
        variant: "destructive",
      });
      return;
    }

    try {
      await onCreate(newName.trim());
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas tworzenia talii",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed" onClick={handleCreate}>
      <CardContent className="flex flex-col items-center justify-center h-32">
        <Plus className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Dodaj nową talię</p>
      </CardContent>
    </Card>
  );
};

export const DecksGrid: React.FC = () => {
  const [decks, setDecks] = useState<DeckData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch decks from API
  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/decks');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          throw new Error(`Failed to fetch decks: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Decks data received:', data);
        setDecks(data.decks || []);
      } catch (error) {
        console.error('Error fetching decks:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się pobrać talii",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDecks();
  }, []);

  const handleEditDeck = async (id: number, newName: string) => {
    try {
      const response = await fetch(`/api/decks?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deck_name: newName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update deck');
      }

      // Update local state
      setDecks(prev => prev.map(deck => 
        deck.id === id 
          ? { ...deck, deck_name: newName, updated_at: new Date().toISOString() }
          : deck
      ));
    } catch (error) {
      console.error('Error updating deck:', error);
      throw error;
    }
  };

  const handleDeleteDeck = async (id: number) => {
    try {
      const response = await fetch(`/api/decks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }

      // Update local state
      setDecks(prev => prev.filter(deck => deck.id !== id));
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  };

  const handleCreateDeck = async (name: string) => {
    // For now, we'll create a deck by adding flashcards to it
    // This is a placeholder - you might want to implement a proper deck creation endpoint
    toast({
      title: "Info",
      description: "Aby utworzyć nową talię, przejdź do generowania fiszek",
      variant: "default",
    });
  };

  if (isLoading) {
    return <OverlayLoader isVisible={true} />;
  }

  if (decks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak talii</CardTitle>
          <CardDescription>
            Nie masz jeszcze żadnych talii. Utwórz pierwszą talię lub wygeneruj nowe fiszki przy użyciu AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => window.location.href = '/generate'} className="mr-2">
            Wygeneruj fiszki AI
          </Button>
          <Button onClick={() => window.location.href = '/flashcards/add'} variant="outline">
            Dodaj ręcznie
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">
            Twoje talie ({decks.length})
          </h2>
          <p className="text-muted-foreground text-sm">
            Zarządzaj swoimi taliami fiszek
          </p>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CreateDeckCard onCreate={handleCreateDeck} />
        {decks.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            onEdit={handleEditDeck}
            onDelete={handleDeleteDeck}
          />
        ))}
      </div>
    </div>
  );
};
