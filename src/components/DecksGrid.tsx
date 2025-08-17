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
import { EditDeckNameDialog } from "./EditDeckNameDialog";
import { CreateDeckDialog } from "./CreateDeckDialog";
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
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    // Navigate to deck details with flashcards
    window.location.href = `/deck/${deck.id}`;
  };

  const handleEdit = async (newName: string) => {
    try {
      await onEdit(deck.id, newName);
      toast({
        title: "Sukces",
        description: "Nazwa talii została zaktualizowana",
        variant: "success",
      });
    } catch {
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
    } catch {
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
            <EditDeckNameDialog currentName={deck.deck_name} onSave={handleEdit}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" aria-label="Edytuj talię">
                <Edit2 className="h-3 w-3" />
              </Button>
            </EditDeckNameDialog>

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
                    Czy na pewno chcesz usunąć talię &quot;{deck.deck_name}&quot;? Wszystkie fiszki w tej talii zostaną
                    również usunięte. Ta akcja nie może być cofnięta.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            {deck.flashcard_count} {deck.flashcard_count === 1 ? "fiszka" : "fiszek"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Kliknij, aby zobaczyć fiszki</p>
      </CardContent>
    </Card>
  );
};

const CreateDeckCard: React.FC<{ onCreate: (name: string) => void }> = ({ onCreate }) => {
  const handleCreate = async (name: string) => {
    try {
      await onCreate(name);
    } catch {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas tworzenia talii",
        variant: "destructive",
      });
    }
  };

  return (
    <CreateDeckDialog onSave={handleCreate}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-32">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Dodaj nową talię</p>
        </CardContent>
      </Card>
    </CreateDeckDialog>
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
        const response = await fetch("/api/decks");
        if (!response.ok) {
          throw new Error(`Failed to fetch decks: ${response.status}`);
        }
        const data = await response.json();
        // console.log("Decks data received:", data);
        setDecks(data.decks || []);
      } catch {
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
    const response = await fetch(`/api/decks?id=${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deck_name: newName }),
    });

    if (!response.ok) {
      throw new Error("Failed to update deck");
    }

    // Update local state
    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === id ? { ...deck, deck_name: newName, updated_at: new Date().toISOString() } : deck
      )
    );
  };

  const handleDeleteDeck = async (id: number) => {
    const response = await fetch(`/api/decks?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete deck");
    }

    // Update local state
    setDecks((prev) => prev.filter((deck) => deck.id !== id));
  };

  const handleCreateDeck = async (name: string) => {
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deck_name: name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create deck");
    }

    const data = await response.json();
    const newDeck = data.deck;

    // Add new deck to local state
    setDecks((prev) => [newDeck, ...prev]);

    toast({
      title: "Sukces",
      description: `Talia "${name}" została utworzona`,
      variant: "success",
    });

    // Redirect to the new deck's page
    window.location.href = `/deck/${newDeck.id}`;
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
          <Button onClick={() => (window.location.href = "/generate")} className="mr-2">
            Wygeneruj fiszki AI
          </Button>
          <CreateDeckDialog onSave={handleCreateDeck}>
            <Button variant="outline">Dodaj ręcznie</Button>
          </CreateDeckDialog>
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
            Twoje talie <span className="text-[#d1b6d3]">({decks.length})</span>
          </h2>
          <p className="text-muted-foreground text-sm">Zarządzaj swoimi taliami fiszek</p>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <CreateDeckCard onCreate={handleCreateDeck} />
        {decks.map((deck) => (
          <DeckCard key={deck.id} deck={deck} onEdit={handleEditDeck} onDelete={handleDeleteDeck} />
        ))}
      </div>
    </div>
  );
};
