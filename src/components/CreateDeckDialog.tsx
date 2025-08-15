import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateDeckDialogProps {
  children: React.ReactNode;
  onSave: (name: string) => void;
  isLoading?: boolean;
}

export const CreateDeckDialog: React.FC<CreateDeckDialogProps> = ({
  children,
  onSave,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDeckName("");
      setError("");
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmedName = deckName.trim();
    
    if (!trimmedName) {
      setError("Nazwa talii nie może być pusta");
      return;
    }

    try {
      onSave(trimmedName);
      setIsOpen(false);
    } catch (error) {
      setError("Wystąpił błąd podczas tworzenia talii");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeckName(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Utwórz nową talię</DialogTitle>
          <DialogDescription>
            Wprowadź nazwę dla nowej talii fiszek. Kliknij utwórz, gdy skończysz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-deck-name">Nazwa talii</Label>
            <Input
              id="new-deck-name"
              value={deckName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Wprowadź nazwę talii..."
              disabled={isLoading}
              autoFocus
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading || !deckName.trim()}
          >
            {isLoading ? "Tworzenie..." : "Utwórz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
