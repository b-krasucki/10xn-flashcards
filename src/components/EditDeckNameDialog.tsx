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

interface EditDeckNameDialogProps {
  children: React.ReactNode;
  currentName: string;
  onSave: (newName: string) => void;
  isLoading?: boolean;
}

export const EditDeckNameDialog: React.FC<EditDeckNameDialogProps> = ({
  children,
  currentName,
  onSave,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const [error, setError] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setError("");
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setError("Nazwa talii nie może być pusta");
      return;
    }

    if (trimmedName === currentName) {
      // No changes, just close
      setIsOpen(false);
      return;
    }

    try {
      onSave(trimmedName);
      setIsOpen(false);
    } catch {
      setError("Wystąpił błąd podczas zapisywania");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    if (error) {
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj nazwę talii</DialogTitle>
          <DialogDescription>Wprowadź nową nazwę dla talii. Kliknij zapisz, gdy skończysz.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="deck-name">Nazwa talii</Label>
            <Input
              id="deck-name"
              value={newName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Wprowadź nazwę talii..."
              disabled={isLoading}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !newName.trim()}>
            {isLoading ? "Zapisywanie..." : "Zapisz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
