import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    backgroundColor: "var(--surface-secondary)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-secondary)",
  },
  info: {
    backgroundColor: "var(--info-bg)",
    borderColor: "var(--info)",
    color: "var(--info)",
  },
  success: {
    backgroundColor: "var(--success-bg)",
    borderColor: "var(--success)",
    color: "var(--success)",
  },
  warning: {
    backgroundColor: "var(--warning-bg)",
    borderColor: "var(--warning)",
    color: "var(--warning)",
  },
  danger: {
    backgroundColor: "var(--danger-bg)",
    borderColor: "var(--danger)",
    color: "var(--danger)",
  },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, style, variant = "neutral", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex w-fit items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
          className,
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  },
);

Badge.displayName = "Badge";

// Made with Bob
