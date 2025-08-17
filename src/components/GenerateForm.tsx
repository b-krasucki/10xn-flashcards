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
    model: "google/gemini-2.5-flash",
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
    // Text change tracking
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
        throw new Error(errorData.error || "Nie udało się wygenerować fiszek");
      }

      const data = (await response.json()) as CreateGenerationResponseDto & { deckName?: string };
      setState((prev) => ({
        ...prev,
        proposals: data.proposals,
        generationId: data.generation_id,
        deckName: data.deckName ?? `Wygenerowana talia ${data.generation_id ?? ""}`.trim(),
        isLoading: false,
      }));

      toast({
        title: "Sukces",
        description: "Fiszki zostały pomyślnie wygenerowane",
        variant: "success",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));

      toast({
        title: "Błąd",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRegenerateDeckName = async (text: string): Promise<string | null> => {
    if (!text) {
      // No source text available for name regeneration
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
        throw new Error(errorData.error || "Nie udało się wygenerować nazwy talii");
      }

      const data = (await response.json()) as { deckName: string };
      setState((prev) => ({ ...prev, deckName: data.deckName, isRegeneratingName: false }));

      toast({
        title: "Sukces",
        description: "Nazwa talii została pomyślnie wygenerowana",
        variant: "success",
      });

      return data.deckName;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas generowania nazwy talii";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isRegeneratingName: false,
      }));

      toast({
        title: "Błąd",
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
    // Resetting form state

    // Force immediate state update for sourceText
    setState(() => {
      // Previous sourceText tracking
      const newState = {
        sourceText: "",
        model: "google/gemini-2.5-flash",
        isLoading: false,
        error: null,
        proposals: null,
        generationId: null,
        deckName: null,
        isRegeneratingName: false,
      };
      // New sourceText tracking
      return newState;
    });

    // Log after state update to verify
    setTimeout(() => {
      // State cleared after reset
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
    // Handle save success and reset form
    resetForm();
    // Redirect to dashboard after successful save
    setTimeout(() => {
      window.location.href = "/";
    }, 500); // Small delay to allow toast to show
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-white">
            Generuj nowe fiszki {state.generationId ? `(ID generacji: ${state.generationId})` : ""}
          </CardTitle>
          <CardDescription className="text-white/70">
            Wprowadź materiały do nauki i pozwól AI utworzyć dla Ciebie fiszki
          </CardDescription>
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