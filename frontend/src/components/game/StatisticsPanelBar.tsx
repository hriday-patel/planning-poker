"use client";

import { ChevronUp } from "lucide-react";
import { IconButton } from "@/components/ui";

interface StatisticsPanelBarProps {
  onOpen: () => void;
}

export default function StatisticsPanelBar({ onOpen }: StatisticsPanelBarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-between border-t px-4 py-2.5"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      <span className="text-sm font-semibold">Voting statistics</span>
      <IconButton
        onClick={onOpen}
        aria-label="Open voting statistics"
        title="Open voting statistics"
        size="sm"
        variant="secondary"
        style={{
          backgroundColor: "var(--surface-secondary)",
          borderColor: "var(--border-color)",
          color: "var(--text-secondary)",
        }}
      >
        <ChevronUp className="h-4 w-4" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
