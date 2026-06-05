"use client";

import { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui";
import { ModalShell, ModalHeader, ModalFooter } from "@/components/ui/Modal";

interface ChangeEstimateModalProps {
  isOpen: boolean;
  deckName: string;
  deckValues: string[];
  currentEstimate: string;
  calculatedEstimate: string | null;
  onClose: () => void;
  onSelectEstimate: (estimate: string) => void;
  onSaveEstimate: () => void;
  hasUnsavedEstimate: boolean;
}

export default function ChangeEstimateModal({
  isOpen,
  deckName,
  deckValues,
  currentEstimate,
  calculatedEstimate,
  onClose,
  onSelectEstimate,
  onSaveEstimate,
  hasUnsavedEstimate,
}: ChangeEstimateModalProps) {
  const [selectedCard, setSelectedCard] = useState<string>(currentEstimate);

  // Reset selected card when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCard(currentEstimate);
    }
  }, [isOpen, currentEstimate]);

  const handleCardSelect = (value: string) => {
    setSelectedCard(value);
    onSelectEstimate(value);
  };

  const handleUseAuto = () => {
    if (calculatedEstimate) {
      setSelectedCard(calculatedEstimate);
      onSelectEstimate(calculatedEstimate);
    }
  };

  const cardCount = Math.max(deckValues.length, 1);
  const isLargeDeck = cardCount > 10;
  const isDenseDeck = cardCount > 13;
  const deckGapClass = isDenseDeck
    ? "gap-1"
    : isLargeDeck
      ? "gap-1.5"
      : "gap-2";
  const cardSizeClass = isDenseDeck
    ? "h-16 rounded-md text-sm sm:h-20 sm:text-base"
    : isLargeDeck
      ? "h-20 rounded-lg text-base sm:h-24 sm:text-lg"
      : "h-24 rounded-lg text-lg sm:h-28";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-4xl">
      <ModalHeader
        icon={Edit3}
        title="Change Estimate"
        subtitle={`Select a card from ${deckName}`}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Current estimate</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {currentEstimate || "Not set"}
              </p>
            </div>
            {calculatedEstimate && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUseAuto}
              >
                Use Auto ({calculatedEstimate})
              </Button>
            )}
          </div>
        </div>

        <div
          className={`grid ${deckGapClass}`}
          role="list"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${isDenseDeck ? "3.5rem" : isLargeDeck ? "4.5rem" : "5.5rem"}, 1fr))`,
          }}
        >
          {deckValues.map((value) => (
            <div key={value} role="listitem" className="min-w-0">
              <button
                type="button"
                onClick={() => handleCardSelect(value)}
                aria-pressed={selectedCard === value}
                title={
                  selectedCard === value
                    ? `Selected ${value}`
                    : `Select ${value}`
                }
                className={`flex w-full items-center justify-center border font-bold transition-transform hover:-translate-y-0.5 ${cardSizeClass}`}
                style={{
                  backgroundColor:
                    selectedCard === value
                      ? "var(--surface-accent)"
                      : "var(--surface-secondary)",
                  borderColor:
                    selectedCard === value
                      ? "var(--primary)"
                      : "var(--border-color)",
                  color:
                    selectedCard === value
                      ? "var(--primary)"
                      : "var(--text-primary)",
                }}
              >
                <span className="max-w-full truncate px-0.5">{value}</span>
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Select a card to change the estimate, then click "Save Estimate" to
          apply the change.
        </p>
      </div>

      <ModalFooter layout="inline">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          onClick={() => {
            onSaveEstimate();
            onClose();
          }}
          disabled={!hasUnsavedEstimate}
        >
          Save Estimate
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
