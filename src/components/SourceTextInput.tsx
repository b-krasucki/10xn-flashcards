import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SourceTextInputProps {
  value: string;
  onChange: (text: string) => void;
  isInvalid?: boolean;
  minLength?: number;
  maxLength?: number;
}

export const SourceTextInput = ({ value, onChange, isInvalid = false }: SourceTextInputProps) => {
  // Add logging for prop changes
  useEffect(() => {
    console.log(`SourceTextInput: Value prop changed to length ${value.length}`);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    console.log(`SourceTextInput: Text changed to length ${newText.length}`);
    onChange(newText);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="sourceText">Source Material</Label>
      <Textarea
        id="sourceText"
        placeholder="Paste your study materials here (min 1000 characters, max 10000 characters)"
        className={`min-h-32 ${isInvalid ? "border-red-500" : ""}`}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
