import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

type CardVariant = "primary" | "secondary" | "accent" | "muted";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--surface-primary)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
  secondary: {
    backgroundColor: "var(--surface-secondary)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-primary)",
  },
  accent: {
    backgroundColor: "var(--surface-accent)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
  muted: {
    backgroundColor: "var(--bg-muted)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-secondary)",
  },
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, style, variant = "primary", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-lg border shadow-theme", className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";

// Made with Bob
