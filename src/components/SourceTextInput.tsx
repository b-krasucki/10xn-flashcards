import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ChangeEvent } from "react";

interface SourceTextInputProps {
  value: string;
  onChange: (text: string) => void;
  isInvalid: boolean;
  minLength: number;
  maxLength: number;
}

export const SourceTextInput = ({ value, onChange, isInvalid, minLength, maxLength }: SourceTextInputProps) => {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="source-text">Source Text</Label>
      </div>
      <Textarea
        id="source-text"
        defaultValue={value}
        onChange={handleChange}
        className={`min-h-[200px] resize-y ${isInvalid ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        placeholder={`Enter your text here (${minLength}-${maxLength} characters)...`}
        aria-invalid={isInvalid}
        aria-describedby="source-text-description"
      />
      <p id="source-text-description" className="text-sm text-muted-foreground">
        Enter the text you want to generate flashcards from. The text should be between {minLength} and {maxLength}{" "}
        characters.
      </p>
    </div>
  );
};
