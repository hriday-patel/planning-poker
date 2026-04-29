import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./utils";

interface EmptyStateProps {
  action?: ReactNode;
  className?: string;
  description?: string;
  icon?: LucideIcon;
  title: string;
}

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn("rounded-lg border p-6 text-center", className)}
      style={{
        backgroundColor: "var(--surface-secondary)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-primary)",
      }}
    >
      {Icon && (
        <div
          className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg"
          style={{
            backgroundColor: "var(--surface-accent)",
            color: "var(--primary)",
          }}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Made with Bob
