import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MODEL_OPTIONS = [
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
];

interface ModelSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const ModelSelect = ({ value, onChange }: ModelSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="model-select">Model</Label>
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
