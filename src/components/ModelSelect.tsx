import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MODEL_OPTIONS = [
  { value: "google/gemini-2.5-flash-preview", label: "Gemini 2.5 Flash - Preview" },
  { value: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini Beta" },
  { value: "qwen/qwen3-30b-a3b", label: "Qwen3 30B A3B" },
];

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const ModelSelect = ({ value, onChange }: ModelSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="model-select">Choose a model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue placeholder="Select an AI model" />
        </SelectTrigger>
        <SelectContent>
          {MODEL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Select the AI model to use for generating flashcards. More powerful models may produce better results but can
        take longer.
      </p>
    </div>
  );
};
