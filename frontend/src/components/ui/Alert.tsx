import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

type AlertVariant = "info" | "success" | "warning" | "danger" | "neutral";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, React.CSSProperties> = {
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
  neutral: {
    backgroundColor: "var(--surface-secondary)",
    borderColor: "var(--border-subtle)",
    color: "var(--text-secondary)",
  },
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, role, style, variant = "neutral", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role={role || (variant === "danger" ? "alert" : "status")}
        className={cn("rounded-lg border px-4 py-3 text-sm", className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  },
);

Alert.displayName = "Alert";

// Made with Bob
