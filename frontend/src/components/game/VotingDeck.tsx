"use client";

interface VotingDeckProps {
  canPickCards: boolean;
  deckName: string;
  deckValues: string[];
  selectedCard: string | null;
  onCardSelect: (value: string) => void;
}

export default function VotingDeck({
  canPickCards,
  deckName,
  deckValues,
  onCardSelect,
  selectedCard,
}: VotingDeckProps) {
  return (
    <section
      aria-labelledby="voting-deck-heading"
      className="rounded-lg border p-4 shadow-theme"
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="voting-deck-heading" className="text-base font-semibold">
          Voting deck
        </h2>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {deckName}
        </span>
      </div>
      <div
        className="grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] gap-3"
        role="list"
      >
        {deckValues.map((value) => (
          <div key={value} role="listitem">
            <button
              type="button"
              onClick={() => onCardSelect(value)}
              disabled={!canPickCards}
              aria-pressed={selectedCard === value}
              title={
                canPickCards ? `Vote ${value}` : "Pick an issue before voting"
              }
              className="flex h-20 w-full items-center justify-center rounded-lg border text-xl font-bold transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 sm:h-24"
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
              {value}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// Made with Bob
