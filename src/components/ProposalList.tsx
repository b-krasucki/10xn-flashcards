import type { GenerationProposalDto } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProposalListProps {
  proposals: readonly GenerationProposalDto[];
}

export const ProposalList = ({ proposals }: ProposalListProps) => {
  if (!proposals?.length) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Generated Flashcards</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((proposal: GenerationProposalDto, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">Front</CardTitle>
              <CardDescription>{proposal.front}</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-base mb-2">Back</CardTitle>
              <CardDescription>{proposal.back}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
