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
  // Track prop changes
  useEffect(() => {
    // Value prop changed tracking
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // Text change tracking
    onChange(newText);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="sourceText" className="text-white">
        Materiał źródłowy
      </Label>
      <Textarea
        id="sourceText"
        placeholder="Wklej tutaj swoje materiały do nauki (min. 1000 znaków, maks. 10000 znaków)"
        className={`min-h-32 text-white bg-black/20 border-white/20 placeholder:text-white/50 ${isInvalid ? "border-red-400" : ""}`}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
