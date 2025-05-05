import { useState } from "react";
import type { GenerationProposalDto } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProposalListProps {
  proposals: readonly GenerationProposalDto[];
  // TODO: Add callback props for handling approve, edit, reject actions
}

export const ProposalList = ({ proposals: initialProposals }: ProposalListProps) => {
  const [proposals, setProposals] = useState(initialProposals);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set()); // State for rejected cards

  if (!proposals?.length) return null;

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditFront(proposals[index].front);
    setEditBack(proposals[index].back);
  };

  const handleCancelClick = () => {
    setEditingIndex(null);
    setEditFront("");
    setEditBack("");
  };

  const handleSaveClick = (index: number) => {
    const updatedProposals = [...proposals];
    updatedProposals[index] = { ...updatedProposals[index], front: editFront, back: editBack };
    setProposals(updatedProposals);
    setEditingIndex(null);
    setEditFront("");
    setEditBack("");
    // TODO: Call onEdit callback prop here
  };

  const handleApproveClick = (index: number) => {
    const newApprovedIndices = new Set(approvedIndices);
    const newRejectedIndices = new Set(rejectedIndices);
    newApprovedIndices.add(index);
    newRejectedIndices.delete(index); // Ensure it's not rejected if approved
    setApprovedIndices(newApprovedIndices);
    setRejectedIndices(newRejectedIndices);
    setEditingIndex(null); // Cancel edit if approving
    // TODO: Call onApprove callback prop here
  };

  const handleRejectClick = (index: number) => {
    const newRejectedIndices = new Set(rejectedIndices);
    const newApprovedIndices = new Set(approvedIndices);
    newRejectedIndices.add(index);
    newApprovedIndices.delete(index); // Ensure it's not approved if rejected
    setRejectedIndices(newRejectedIndices);
    setApprovedIndices(newApprovedIndices);
    setEditingIndex(null); // Cancel edit if rejecting
    // TODO: Call onReject callback prop here
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Generated Flashcards</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((proposal: GenerationProposalDto, index: number) => {
          const isEditing = editingIndex === index;
          const isApproved = approvedIndices.has(index);
          const isRejected = rejectedIndices.has(index);

          // Determine background color: rejected takes precedence
          const cardBgClass = isRejected ? "bg-red-100" : isApproved ? "bg-green-100" : "";
          // Controls are no longer globally disabled based on rejected state

          return (
            <Card key={index} className={cardBgClass}>
              <CardHeader>
                <CardTitle className="text-base">Front</CardTitle>
                {isEditing ? (
                  <Input
                    value={editFront}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFront(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <CardDescription>{proposal.front}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <CardTitle className="text-base mb-2">Back</CardTitle>
                {isEditing ? (
                  <Input
                    value={editBack}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditBack(e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <CardDescription>{proposal.back}</CardDescription>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancelClick}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSaveClick(index)}>
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Edit button is never disabled by approve/reject status anymore */}
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(index)}>
                      Edit
                    </Button>
                    {/* Reject button disabled only if currently rejected */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectClick(index)}
                      disabled={isRejected}
                    >
                      {isRejected ? "Rejected" : "Reject"}
                    </Button>
                    {/* Approve button disabled only if currently approved */}
                    <Button
                      size="sm"
                      onClick={() => handleApproveClick(index)}
                      disabled={isApproved}
                      className="bg-emerald-100 hover:bg-emerald-300 text-emerald-900 disabled:bg-emerald-900 disabled:text-emerald-100"
                    >
                      {isApproved ? "Approved" : "Approve"}
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Add Save and Reject All buttons */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="destructive">Reject All Flashcards</Button>
        <Button className="bg-emerald-200 hover:bg-emerald-300 text-emerald-900">Save Approved Flashcards</Button>
      </div>
    </div>
  );
};
