import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MODEL_OPTIONS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
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
      <Label htmlFor="model-select" className="text-white">Wybierz model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="model-select" className="w-full text-white border-white/20 bg-black/20">
          <SelectValue placeholder="Wybierz model AI" />
        </SelectTrigger>
        <SelectContent className="bg-black/80 border-white/20 backdrop-blur-md">
          {MODEL_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="radix-select-item-override !text-white !bg-transparent hover:!bg-white/20 focus:!bg-white/20 data-[highlighted]:!bg-white/20 data-[highlighted]:!text-white data-[state=checked]:!bg-green-500/20 data-[state=checked]:!text-green-400 data-[state=checked]:!font-semibold"
              style={{ color: 'white', background: 'transparent' }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-white/70">
        Wybierz model AI do generowania fiszek. Bardziej zaawansowane modele mogą dawać lepsze rezultaty, ale działają wolniej.
      </p>
    </div>
  );
};
