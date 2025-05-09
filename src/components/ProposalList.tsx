import { useState, useEffect } from "react";
import type { GenerationProposalItemDto } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProposalListProps {
  proposals: readonly GenerationProposalItemDto[];
  sourceText?: string;
  deckName: string;
  onSave?: (proposalsToSave: GenerationProposalItemDto[], deckName: string) => void;
  onDeckNameChange?: (newName: string) => void;
  onRegenerateDeckName?: (sourceText: string) => Promise<string | null>;
  onEdit?: (proposal: GenerationProposalItemDto, index: number) => void;
}

interface FlashcardStats {
  approved: number;
  edited: number;
  rejected: number;
  unmarked: number;
}

export const ProposalList = ({
  proposals: initialProposals,
  sourceText,
  deckName: initialDeckName,
  onSave,
  onDeckNameChange,
  onRegenerateDeckName,
  onEdit,
}: ProposalListProps) => {
  const [proposals, setProposals] = useState(initialProposals);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unmarkedIndices, setUnmarkedIndices] = useState<number[]>([]);
  const [deckName, setDeckName] = useState<string>(initialDeckName);
  const [isEditingDeckName, setIsEditingDeckName] = useState<boolean>(false);
  const [tempDeckName, setTempDeckName] = useState<string>("");
  const [isRegeneratingName, setIsRegeneratingName] = useState<boolean>(false);
  const [editedCount, setEditedCount] = useState<number>(0);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    approved: 0,
    edited: 0,
    rejected: 0,
    unmarked: 0,
  });

  useEffect(() => {
    setDeckName(initialDeckName);
  }, [initialDeckName]);

  if (!proposals?.length && !initialProposals?.length) return null;

  const handleDeckNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempDeckName(event.target.value);
  };

  const handleEditDeckNameClick = () => {
    setTempDeckName(deckName);
    setIsEditingDeckName(true);
  };

  const handleCancelDeckNameClick = () => {
    setIsEditingDeckName(false);
    setTempDeckName("");
  };

  const handleSaveDeckNameClick = () => {
    const newName = tempDeckName.trim();
    if (newName) {
      setDeckName(newName);
      onDeckNameChange?.(newName);
    }
    setIsEditingDeckName(false);
    setTempDeckName("");
  };

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
    updatedProposals[index] = {
      ...updatedProposals[index],
      front: editFront,
      back: editBack,
      source: "ai-edited",
    };
    setProposals(updatedProposals);
    setEditingIndex(null);
    setEditFront("");
    setEditBack("");
    // Automatically approve edited flashcard
    const newApprovedIndices = new Set(approvedIndices);
    newApprovedIndices.add(index);
    setApprovedIndices(newApprovedIndices);
    onEdit?.(updatedProposals[index], index);
  };

  const handleApproveClick = (index: number) => {
    const newApprovedIndices = new Set(approvedIndices);
    const newRejectedIndices = new Set(rejectedIndices);
    newApprovedIndices.add(index);
    newRejectedIndices.delete(index);
    setApprovedIndices(newApprovedIndices);
    setRejectedIndices(newRejectedIndices);
    setEditingIndex(null);
  };

  const handleRejectClick = (index: number) => {
    const newRejectedIndices = new Set(rejectedIndices);
    const newApprovedIndices = new Set(approvedIndices);
    if (newRejectedIndices.has(index)) {
      newRejectedIndices.delete(index);
    } else {
      newRejectedIndices.add(index);
      newApprovedIndices.delete(index);
    }
    setRejectedIndices(newRejectedIndices);
    setApprovedIndices(newApprovedIndices);
    setEditingIndex(null);
  };

  const handleRejectAllClick = () => {
    setProposals([]);
    setEditingIndex(null);
    setApprovedIndices(new Set());
    setRejectedIndices(new Set());
    // TODO: Call onRejectAll callback prop here
  };

  const calculateFlashcardStats = (): FlashcardStats => {
    const stats: FlashcardStats = {
      approved: 0,
      edited: 0,
      rejected: 0,
      unmarked: 0,
    };

    proposals.forEach((proposal, index) => {
      if (rejectedIndices.has(index)) {
        stats.rejected++;
      } else if (proposal.source === "ai-edited") {
        stats.edited++;
      } else if (approvedIndices.has(index)) {
        stats.approved++;
      } else {
        stats.unmarked++;
      }
    });

    return stats;
  };

  const handleSaveAllClick = () => {
    const proposalsToSave = [...proposals];
    console.log(`Saving all proposals for deck: ${deckName}`, proposalsToSave);

    // Calculate and show statistics before saving
    const stats = calculateFlashcardStats();
    setFlashcardStats(stats);
    setIsStatsModalOpen(true);
  };

  const handleConfirmSaveAll = () => {
    onSave?.([...proposals], deckName);
    setIsStatsModalOpen(false);
  };

  const handleSaveApprovedClick = () => {
    const currentApprovedIndices = Array.from(approvedIndices);
    const currentUnmarkedIndices = proposals
      .map((_, index) => index)
      .filter((index) => !approvedIndices.has(index) && !rejectedIndices.has(index));

    const editedCount = currentUnmarkedIndices.filter((index) => proposals[index].source === "ai-edited").length;

    const approvedToSave = proposals.filter((_, index) => currentApprovedIndices.includes(index));

    if (approvedToSave.length > 0) {
      console.log(`Saving approved proposals for deck: ${deckName}`, approvedToSave);
      onSave?.(approvedToSave, deckName);
    }

    if (currentUnmarkedIndices.length > 0) {
      console.log("Found unmarked proposals:", currentUnmarkedIndices);
      setUnmarkedIndices(currentUnmarkedIndices);
      setEditedCount(editedCount);
      setIsModalOpen(true);
    } else {
      console.log("No unmarked proposals found.");
      // Optional: Add success feedback if only approved were saved
    }
  };

  const handleModalSave = () => {
    const unmarkedToSave = proposals.filter((_, index) => unmarkedIndices.includes(index));
    if (unmarkedToSave.length > 0) {
      console.log(`Saving unmarked proposals from modal for deck: ${deckName}`, unmarkedToSave);
      onSave?.(unmarkedToSave, deckName);
      // Optional: Update state to mark these as approved now?
      // const newlyApproved = new Set(approvedIndices);
      // unmarkedIndices.forEach(idx => newlyApproved.add(idx));
      // setApprovedIndices(newlyApproved);
    }
    setIsModalOpen(false);
    setUnmarkedIndices([]);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setUnmarkedIndices([]);
  };

  const handleRegenerateDeckNameClick = async () => {
    if (!sourceText) {
      console.warn("Cannot regenerate deck name without sourceText.");
      return;
    }

    if (!onRegenerateDeckName) {
      console.warn("onRegenerateDeckName prop not provided.");
      return;
    }

    setIsRegeneratingName(true);
    try {
      const newName = await onRegenerateDeckName(sourceText);
      if (newName) {
        setDeckName(newName);
        onDeckNameChange?.(newName);
      } else {
        console.warn("Regeneration returned null/empty name.");
      }
    } catch (error) {
      console.error("Failed to regenerate deck name:", error);
      // TODO: Show error message to user?
    } finally {
      setIsRegeneratingName(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Generated Flashcards</h2>

      {/* Conditionally render Deck Name section only if there are proposals */}
      {proposals.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="deck-name">Deck Name</Label>
          <div className="flex items-center space-x-2">
            {isEditingDeckName ? (
              <>
                <Input
                  id="deck-name"
                  value={tempDeckName}
                  onChange={handleDeckNameChange}
                  placeholder="Enter a name for this flashcard deck"
                  className="flex-grow"
                />
                <Button variant="outline" size="sm" onClick={handleCancelDeckNameClick}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveDeckNameClick}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <span id="deck-name" className="flex-grow font-medium mr-2">
                  {deckName}
                </span>
                <Button variant="outline" size="sm" onClick={handleEditDeckNameClick} disabled={isRegeneratingName}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateDeckNameClick}
                  disabled={isRegeneratingName || !onRegenerateDeckName}
                >
                  {isRegeneratingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {proposals.length === 0 ? (
        <p className="text-muted-foreground">No flashcard proposals available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {proposals.map((proposal: GenerationProposalItemDto, index: number) => {
            const isEditing = editingIndex === index;
            const isApproved = approvedIndices.has(index);
            const isRejected = rejectedIndices.has(index);
            const isEdited = proposal.source === "ai-edited";
            const cardBgClass = isRejected ? "bg-red-100" : isApproved ? "bg-green-100" : isEdited ? "bg-blue-50" : "";

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
                      {!isRejected && (
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(index)}>
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectClick(index)}
                        disabled={isRejected}
                      >
                        {isRejected ? "Rejected" : "Reject"}
                      </Button>
                      {proposal.source !== "ai-edited" && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveClick(index)}
                          disabled={isApproved}
                          className={`bg-emerald-100 hover:bg-emerald-300 text-emerald-900 disabled:bg-emerald-50 disabled:text-emerald-400 ${isApproved ? "ring-2 ring-emerald-500" : ""}`}
                        >
                          {isApproved ? "Approved" : "Approve"}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Buttons below the grid */}
      {initialProposals.length > 0 && (
        <div className="flex justify-end space-x-4 pt-6">
          <Button variant="destructive" onClick={handleRejectAllClick}>
            Reject All Flashcards
          </Button>
          <Button
            className="bg-emerald-100 hover:bg-emerald-300 text-emerald-900"
            onClick={handleSaveApprovedClick}
            disabled={
              approvedIndices.size === 0 &&
              proposals.filter((p) => !rejectedIndices.has(proposals.indexOf(p))).length === 0
            }
          >
            Save Approved Flashcards
          </Button>
          <Button onClick={handleSaveAllClick} disabled={proposals.length === 0}>
            Save All
          </Button>
        </div>
      )}

      {/* Statistics Modal */}
      <AlertDialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flashcard Statistics</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Here are the statistics for your flashcards:</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                  <span>Approved (ai-generated):</span>
                  <span className="font-semibold">{flashcardStats.approved}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                  <span>Edited (ai-edited):</span>
                  <span className="font-semibold">{flashcardStats.edited}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 p-2 rounded">
                  <span>Rejected:</span>
                  <span className="font-semibold">{flashcardStats.rejected}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span>Unmarked:</span>
                  <span className="font-semibold">{flashcardStats.unmarked}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded border-t-2 border-gray-200 mt-4 pt-4">
                  <span className="font-medium">Total:</span>
                  <span className="font-semibold">
                    {flashcardStats.approved +
                      flashcardStats.edited +
                      flashcardStats.rejected +
                      flashcardStats.unmarked}
                  </span>
                </div>
              </div>
              <p className="mt-4">Do you want to proceed with saving all flashcards?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsStatsModalOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaveAll}>Save All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Existing Unmarked Cards Modal */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Unmarked Flashcards?</AlertDialogTitle>
            <AlertDialogDescription>
              You want to save the approved flashcards. Do you want to save the remaining {unmarkedIndices.length}{" "}
              flashcards that were not marked as approved or rejected for the deck &quot;{deckName}&quot;?
              {editedCount > 0 && (
                <>
                  {" "}
                  Among them, {editedCount} {editedCount === 1 ? "flashcard has" : "flashcards have"} been edited.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleModalCancel}>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleModalSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
