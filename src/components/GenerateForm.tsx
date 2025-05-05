/// <reference lib="dom" />
/// <reference lib="es2015" />

import { useState } from "react";
import type {
  CreateGenerationCommandDto,
  CreateGenerationResponseDto,
  ErrorResponseDto,
  GenerationProposalDto,
} from "../types";
import { SourceTextInput } from "./SourceTextInput";
import { CharCounter } from "./CharCounter";
import { GenerateButton } from "./GenerateButton";
import { OverlayLoader } from "./OverlayLoader";
import { ProposalList } from "./ProposalList";
import { ErrorMessage } from "./ErrorMessage";
import { ModelSelect } from "./ModelSelect";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface GenerateViewState {
  sourceText: string;
  model: string;
  isLoading: boolean;
  error: string | null;
  proposals: GenerationProposalDto[] | null;
  generationId: number | null;
}

const useGenerationForm = () => {
  const [state, setState] = useState<GenerateViewState>({
    sourceText: "",
    model: "google/gemini-2.5-flash-preview", // Default model
    isLoading: false,
    error: null,
    proposals: null,
    generationId: null,
  });

  const charCount = state.sourceText.length;
  const isValidLength = charCount >= 1000 && charCount <= 10000;

  const handleTextChange = (text: string) => {
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

      const data = (await response.json()) as CreateGenerationResponseDto;
      setState((prev) => ({
        ...prev,
        proposals: data.proposals,
        generationId: data.generation_id,
        isLoading: false,
      }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        isLoading: false,
      }));
    }
  };

  return {
    state,
    charCount,
    isValidLength,
    handleTextChange,
    handleModelChange,
    handleGenerateClick,
  };
};

export const GenerateForm = () => {
  const { state, charCount, isValidLength, handleTextChange, handleModelChange, handleGenerateClick } =
    useGenerationForm();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate New Flashcards</CardTitle>
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
      {state.proposals && <ProposalList proposals={state.proposals} />}
      <OverlayLoader isVisible={state.isLoading} />
    </div>
  );
};
