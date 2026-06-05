"use client";

interface VotingDeckProps {
  canPickCards: boolean;
  deckName: string;
  deckValues: string[];
  embedded?: boolean;
  selectedCard: string | null;
  onCardSelect: (value: string) => void;
}

/**
 * Sort deck values: numeric values in ascending order, then special characters
 */
const sortDeckValues = (values: string[]): string[] => {
  const numeric: { value: string; num: number }[] = [];
  const special: string[] = [];

  values.forEach((value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === num.toString()) {
      numeric.push({ value, num });
    } else {
      special.push(value);
    }
  });

  // Sort numeric values by their numeric value
  numeric.sort((a, b) => a.num - b.num);

  // Combine: numeric first, then special characters
  return [...numeric.map((item) => item.value), ...special];
};

/**
 * Format deck name for display
 */
const formatDeckName = (name: string): string => {
  // Check if it's a custom deck with generated name pattern (e.g., "Custom-guest_xxx-timestamp")
  if (name.startsWith("Custom-")) {
    return "Custom Deck";
  }
  return name;
};

export default function VotingDeck({
  canPickCards,
  deckName,
  deckValues,
  embedded = false,
  onCardSelect,
  selectedCard,
}: VotingDeckProps) {
  const sortedDeckValues = sortDeckValues(deckValues);
  const displayDeckName = formatDeckName(deckName);
  const cardCount = Math.max(sortedDeckValues.length, 1);
  const isLargeDeck = cardCount > 10;
  const isDenseDeck = cardCount > 13;
  const deckGapClass = isDenseDeck
    ? "gap-1"
    : isLargeDeck
      ? "gap-1.5"
      : "gap-2";
  const cardSizeClass = isDenseDeck
    ? embedded
      ? "h-full min-h-16 rounded-md text-sm sm:min-h-20 sm:text-base"
      : "h-12 rounded-md text-sm sm:h-14 sm:text-base"
    : isLargeDeck
      ? embedded
        ? "h-full min-h-20 rounded-lg text-base sm:min-h-24 sm:text-lg"
        : "h-14 rounded-lg text-base sm:h-16 sm:text-lg"
      : embedded
        ? "h-full min-h-24 rounded-lg text-lg sm:min-h-28"
        : "h-16 rounded-lg text-lg sm:h-18";

  return (
    <section
      aria-labelledby="voting-deck-heading"
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : "rounded-lg border p-4 shadow-theme"
      }
      style={
        embedded
          ? undefined
          : {
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-color)",
            }
      }
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <h2 id="voting-deck-heading" className="text-sm font-semibold">
          Choose your card
        </h2>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {displayDeckName}
        </span>
      </div>
      <div
        className={`grid ${embedded ? "min-h-0 flex-1" : ""} ${deckGapClass}`}
        role="list"
        style={{ gridTemplateColumns: `repeat(${cardCount}, minmax(0, 1fr))` }}
      >
        {sortedDeckValues.map((value) => (
          <div
            key={value}
            role="listitem"
            className={`min-w-0 ${embedded ? "h-full" : ""}`}
          >
            <button
              type="button"
              onClick={() => onCardSelect(value)}
              disabled={!canPickCards}
              aria-pressed={selectedCard === value}
              title={
                canPickCards
                  ? selectedCard === value
                    ? `Unselect ${value}`
                    : `Vote ${value}`
                  : "Pick an issue before voting"
              }
              className={`flex w-full items-center justify-center border font-bold transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${cardSizeClass}`}
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
    </section>
  );
}

// Made with Bob
