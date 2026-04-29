import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

interface PageShellProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageShell({
  children,
  className,
  style,
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn("min-h-screen", className)}
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: "var(--primary)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && (
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      )}
    </header>
  );
}

// Made with Bob
