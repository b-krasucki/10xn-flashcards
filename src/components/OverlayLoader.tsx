import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OverlayLoaderProps {
  isVisible: boolean;
}

export const OverlayLoader = ({ isVisible }: OverlayLoaderProps) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      role="alert"
      aria-label="Loading"
    >
      <Card>
        <CardContent className="p-8 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Generating flashcards...</p>
          <p className="text-sm text-muted-foreground">This may take a few moments</p>
        </CardContent>
      </Card>
    </div>
  );
};
