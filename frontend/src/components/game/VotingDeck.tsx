"use client";

interface VotingDeckProps {
  canPickCards: boolean;
  deckName: string;
  deckValues: string[];
  embedded?: boolean;
  selectedCard: string | null;
  onCardSelect: (value: string) => void;
}

export default function VotingDeck({
  canPickCards,
  deckName,
  deckValues,
  embedded = false,
  onCardSelect,
  selectedCard,
}: VotingDeckProps) {
  const cardCount = Math.max(deckValues.length, 1);
  const isLargeDeck = cardCount > 10;
  const isDenseDeck = cardCount > 13;
  const deckGapClass = isDenseDeck
    ? "gap-1"
    : isLargeDeck
      ? "gap-1.5"
      : "gap-2";
  const cardSizeClass = isDenseDeck
    ? "h-10 rounded-md text-xs sm:h-11 sm:text-sm"
    : isLargeDeck
      ? "h-11 rounded-md text-sm sm:h-12 sm:text-base"
      : embedded
        ? "h-12 rounded-lg text-base sm:h-14 sm:text-lg"
        : "h-14 rounded-lg text-lg sm:h-16";

  return (
    <section
      aria-labelledby="voting-deck-heading"
      className={embedded ? "" : "rounded-lg border p-4 shadow-theme"}
      style={
        embedded
          ? undefined
          : {
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-color)",
            }
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="voting-deck-heading" className="text-sm font-semibold">
          Choose your card
        </h2>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {deckName}
        </span>
      </div>
      <div
        className={`grid ${deckGapClass}`}
        role="list"
        style={{ gridTemplateColumns: `repeat(${cardCount}, minmax(0, 1fr))` }}
      >
        {deckValues.map((value) => (
          <div key={value} role="listitem" className="min-w-0">
            <button
              type="button"
              onClick={() => onCardSelect(value)}
              disabled={!canPickCards}
              aria-pressed={selectedCard === value}
              title={
                canPickCards ? `Vote ${value}` : "Pick an issue before voting"
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
