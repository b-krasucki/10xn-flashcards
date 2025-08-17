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
import type { GenerationProposalItemDto } from "../types";

interface ProposalCardProps {
  proposal: GenerationProposalItemDto & { id: string };
  index: number;
  onAccept: () => void;
  onEdit: (editedProposal: GenerationProposalItemDto) => void;
  onReject: () => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, index, onAccept, onEdit, onReject }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(proposal.front);
  const [editedBack, setEditedBack] = useState(proposal.back);

  const handleSaveEdit = () => {
    if (!editedFront.trim() || !editedBack.trim()) {
      toast({
        title: "Błąd",
        description: "Przód i tył fiszki nie mogą być puste",
        variant: "destructive",
      });
      return;
    }

    onEdit({
      front: editedFront.trim(),
      back: editedBack.trim(),
      source: "ai-edited",
    });
    setIsEditing(false);

    toast({
      title: "Sukces",
      description: "Fiszka została edytowana",
      variant: "success",
    });
  };

  const handleCancelEdit = () => {
    setEditedFront(proposal.front);
    setEditedBack(proposal.back);
    setIsEditing(false);
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="text-lg">Fiszka #{index + 1}</CardTitle>
        <CardDescription>Źródło: {proposal.source === "ai-full" ? "AI" : "AI (edytowane)"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`front-${proposal.id}`}>Przód fiszki</Label>
              <Input
                id={`front-${proposal.id}`}
                value={editedFront}
                onChange={(e) => setEditedFront(e.target.value)}
                placeholder="Pytanie lub termin"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{editedFront.length}/200 znaków</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`back-${proposal.id}`}>Tył fiszki</Label>
              <Textarea
                id={`back-${proposal.id}`}
                value={editedBack}
                onChange={(e) => setEditedBack(e.target.value)}
                placeholder="Odpowiedź lub definicja"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{editedBack.length}/500 znaków</p>
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
              <p className="text-sm bg-muted p-3 rounded">{proposal.front}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Tył:</h4>
              <p className="text-sm bg-muted p-3 rounded">{proposal.back}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={onAccept} size="sm" aria-label="Zaakceptuj fiszkę">
                Zaakceptuj
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" aria-label="Edytuj fiszkę">
                Edytuj
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" aria-label="Odrzuć fiszkę">
                    Odrzuć
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Odrzuć fiszkę</AlertDialogTitle>
                    <AlertDialogDescription>
                      Czy na pewno chcesz odrzucić tę fiszkę? Ta akcja nie może być cofnięta.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={onReject}>Odrzuć</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const ProposalReview: React.FC = () => {
  const [proposals, setProposals] = useState<(GenerationProposalItemDto & { id: string })[]>([]);
  const [deckName, setDeckName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mock data - in real app this would come from URL params or API
  useEffect(() => {
    // Mock loading proposals from URL params or session storage
    const mockProposals: (GenerationProposalItemDto & { id: string })[] = [
      {
        id: "1",
        front: "Co to jest React?",
        back: "React to biblioteka JavaScript do tworzenia interfejsów użytkownika, opracowana przez Facebook.",
        source: "ai-full",
      },
      {
        id: "2",
        front: "Co to jest JSX?",
        back: "JSX to rozszerzenie składni JavaScript, które pozwala pisać kod przypominający HTML w plikach JavaScript.",
        source: "ai-full",
      },
      {
        id: "3",
        front: "Co to są hooki w React?",
        back: "Hooki to funkcje pozwalające 'zaczepiać się' do stanu React i funkcjonalności cyklu życia z komponentów funkcyjnych.",
        source: "ai-full",
      },
    ];

    setProposals(mockProposals);
    setDeckName("Podstawy React - Generacja #42");
  }, []);

  const handleAcceptProposal = (index: number) => {
    toast({
      title: "Sukces",
      description: "Fiszka została zaakceptowana",
      variant: "success",
    });
  };

  const handleEditProposal = (index: number, editedProposal: GenerationProposalItemDto) => {
    setProposals((prev) => prev.map((proposal, i) => (i === index ? { ...proposal, ...editedProposal } : proposal)));
  };

  const handleRejectProposal = (index: number) => {
    setProposals((prev) => prev.filter((_, i) => i !== index));
    toast({
      title: "Sukces",
      description: "Fiszka została odrzucona",
      variant: "success",
    });
  };

  const handleSaveAll = async () => {
    if (proposals.length === 0) {
      toast({
        title: "Błąd",
        description: "Nie ma fiszek do zapisania",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Mock API call - in real app this would save to backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Sukces",
        description: `Zapisano ${proposals.length} fiszek do talii "${deckName}"`,
        variant: "success",
      });

      // Redirect to flashcards page
      window.location.href = "/flashcards";
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił błąd podczas zapisywania fiszek",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (proposals.length === 0 && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brak propozycji</CardTitle>
          <CardDescription>Nie ma propozycji fiszek do przeglądu. Wróć do generowania.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => (window.location.href = "/generate")}>Wróć do generowania</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deck Name Section */}
      <Card>
        <CardHeader>
          <CardTitle>Nazwa talii</CardTitle>
          <CardDescription>Podaj nazwę dla nowej talii fiszek</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="Wprowadź nazwę talii"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{deckName.length}/100 znaków</p>
        </CardContent>
      </Card>

      {/* Proposals List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Propozycje fiszek ({proposals.length})</h2>
          <Button onClick={handleSaveAll} disabled={!deckName.trim() || proposals.length === 0 || isSaving} size="lg">
            {isSaving ? "Zapisywanie..." : `Zapisz wszystkie (${proposals.length})`}
          </Button>
        </div>

        <div className="grid gap-4">
          {proposals.map((proposal, index) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              index={index}
              onAccept={() => handleAcceptProposal(index)}
              onEdit={(editedProposal) => handleEditProposal(index, editedProposal)}
              onReject={() => handleRejectProposal(index)}
            />
          ))}
        </div>
      </div>

      <OverlayLoader isVisible={isLoading || isSaving} />
    </div>
  );
};
