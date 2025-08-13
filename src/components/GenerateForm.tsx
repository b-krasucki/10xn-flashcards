/// <reference lib="dom" />
/// <reference lib="es2015" />

import { useState } from "react";
import type {
  CreateGenerationCommandDto,
  CreateGenerationResponseDto,
  ErrorResponseDto,
  GenerationProposalItemDto,
} from "../types";
import { SourceTextInput } from "./SourceTextInput";
import { CharCounter } from "./CharCounter";
import { GenerateButton } from "./GenerateButton";
import { OverlayLoader } from "./OverlayLoader";
import { ProposalList } from "./ProposalList";
import { ErrorMessage } from "./ErrorMessage";
import { ModelSelect } from "./ModelSelect";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "@/lib/utils/toast";

interface GenerateViewState {
  sourceText: string;
  model: string;
  isLoading: boolean;
  error: string | null;
  proposals: GenerationProposalItemDto[] | null;
  generationId: number | null;
  deckName: string | null;
  isRegeneratingName: boolean;
}

const useGenerationForm = () => {
  const [state, setState] = useState<GenerateViewState>({
    sourceText: "",
    model: "google/gemini-2.5-flash-preview",
    isLoading: false,
    error: null,
    proposals: null,
    generationId: null,
    deckName: null,
    isRegeneratingName: false,
  });

  const charCount = state.sourceText.length;
  const isValidLength = charCount >= 1000 && charCount <= 10000;

  const handleTextChange = (text: string) => {
    console.log("Changing text to:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));
    setState((prev) => ({
      ...prev,
      sourceText: text,
      error: null, // Clear errors on text change
    }));
  };

  const handleModelChange = (model: string) => {
    setState((prev) => ({
      ...prev,
      model,
      error: null, // Clear errors on model change
    }));
  };

  const handleGenerateClick = async () => {
    if (!isValidLength) return;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      proposals: null,
    }));

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: state.model,
          source_text: state.sourceText,
        } satisfies CreateGenerationCommandDto),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.error || "Failed to generate flashcards");
      }

      const data = (await response.json()) as CreateGenerationResponseDto & { deckName?: string };
      setState((prev) => ({
        ...prev,
        proposals: data.proposals,
        generationId: data.generation_id,
        deckName: data.deckName ?? `Generated Deck ${data.generation_id ?? ""}`.trim(),
        isLoading: false,
      }));

      toast({
        title: "Success",
        description: "Flashcards generated successfully",
        variant: "success",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRegenerateDeckName = async (text: string): Promise<string | null> => {
    if (!text) {
      console.warn("No source text provided for name regeneration.");
      return null;
    }
    setState((prev) => ({ ...prev, isRegeneratingName: true, error: null }));
    try {
      const response = await fetch("/api/generateDeckName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceText: text, model: state.model }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.error || "Failed to regenerate deck name");
      }

      const data = (await response.json()) as { deckName: string };
      setState((prev) => ({ ...prev, deckName: data.deckName, isRegeneratingName: false }));

      toast({
        title: "Success",
        description: "Deck name regenerated successfully",
        variant: "success",
      });

      return data.deckName;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred during name regeneration";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isRegeneratingName: false,
      }));

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };

  // Function to handle manual deck name changes from ProposalList
  const handleDeckNameChange = (newName: string) => {
    setState((prev) => ({ ...prev, deckName: newName }));
  };

  const handleProposalEdit = (editedProposal: GenerationProposalItemDto, index: number) => {
    setState((prev) => {
      if (!prev.proposals) return prev;
      const updatedProposals = [...prev.proposals];
      updatedProposals[index] = editedProposal;
      return { ...prev, proposals: updatedProposals };
    });
  };

  const resetForm = () => {
    console.log("RESETTING FORM STATE");

    // Force immediate state update for sourceText
    setState((prevState) => {
      console.log("Previous sourceText length:", prevState.sourceText.length);
      const newState = {
        sourceText: "",
        model: "google/gemini-2.5-flash-preview",
        isLoading: false,
        error: null,
        proposals: null,
        generationId: null,
        deckName: null,
        isRegeneratingName: false,
      };
      console.log("New sourceText length:", newState.sourceText.length);
      return newState;
    });

    // Log after state update to verify
    setTimeout(() => {
      console.log("After reset, state should be cleared");
    }, 100);
  };

  return {
    state,
    charCount,
    isValidLength,
    handleTextChange,
    handleModelChange,
    handleGenerateClick,
    handleRegenerateDeckName,
    handleDeckNameChange,
    handleProposalEdit,
    resetForm,
  };
};

export const GenerateForm = () => {
  const {
    state,
    charCount,
    isValidLength,
    handleTextChange,
    handleModelChange,
    handleGenerateClick,
    handleRegenerateDeckName,
    handleDeckNameChange,
    handleProposalEdit,
    resetForm,
  } = useGenerationForm();

  const handleSaveSuccess = () => {
    console.log("GenerateForm: handleSaveSuccess called");
    // Add a visible console trace to check the call stack
    console.trace("Reset Form Trace");
    resetForm();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            Generate New Flashcards {state.generationId ? `(generationID: ${state.generationId})` : ""}
          </CardTitle>
          <CardDescription>Enter your study materials and let AI create flashcards for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ModelSelect value={state.model} onChange={handleModelChange} />
          <SourceTextInput
            value={state.sourceText}
            onChange={handleTextChange}
            isInvalid={state.sourceText.length > 0 && !isValidLength}
            minLength={1000}
            maxLength={10000}
          />
          <CharCounter count={charCount} min={1000} max={10000} />
        </CardContent>
        <CardFooter>
          <GenerateButton onClick={handleGenerateClick} disabled={!isValidLength} isLoading={state.isLoading} />
        </CardFooter>
      </Card>

      <ErrorMessage message={state.error} />
      {state.proposals && state.deckName !== null && state.generationId !== null && (
        <ProposalList
          proposals={state.proposals}
          deckName={state.deckName}
          sourceText={state.sourceText}
          generationId={state.generationId}
          onRegenerateDeckName={handleRegenerateDeckName}
          onDeckNameChange={handleDeckNameChange}
          onEdit={handleProposalEdit}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
      <OverlayLoader isVisible={state.isLoading} />
    </div>
  );
};
