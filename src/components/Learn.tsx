import React, { useState } from "react";
import { DeckSelector } from "./DeckSelector";
import { LearnSession } from "./LearnSession";

interface LearnProps {}

export const Learn: React.FC<LearnProps> = () => {
  const [selectedDeck, setSelectedDeck] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleDeckSelected = (deckId: number, deckName: string) => {
    setSelectedDeck({ id: deckId, name: deckName });
  };

  const handleBackToSelection = () => {
    setSelectedDeck(null);
  };

  // If no deck is selected, show the deck selector
  if (!selectedDeck) {
    return <DeckSelector onDeckSelected={handleDeckSelected} />;
  }

  // If deck is selected, show the learning session
  return (
    <LearnSession
      deckId={selectedDeck.id}
      deckName={selectedDeck.name}
      onBack={handleBackToSelection}
    />
  );
};
