"use client";

import { useEffect, type HTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";
import { cn } from "./utils";

interface ModalShellProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  opaqueBackdrop?: boolean;
}

interface ModalHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  layout?: "single" | "split" | "inline";
}

export function ModalShell({
  children,
  className,
  isOpen,
  maxWidthClassName = "max-w-2xl",
  onClose,
  opaqueBackdrop = false,
  ...props
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: opaqueBackdrop
          ? "var(--bg-primary)"
          : "var(--bg-overlay)",
      }}
      role="presentation"
    >
      <div
        className={cn(
          "flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg border shadow-theme-strong",
          maxWidthClassName,
          className,
        )}
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  icon: Icon,
  onClose,
  subtitle,
  title,
}: ModalHeaderProps) {
  return (
    <div
      className="flex items-center justify-between border-b p-5"
      style={{ borderColor: "var(--border-color)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "var(--surface-accent)",
              color: "var(--primary)",
            }}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <IconButton aria-label={`Close ${title}`} onClick={onClose} size="sm">
        <X className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

export function ModalFooter({
  children,
  className,
  layout = "single",
  style,
  ...props
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "border-t p-4",
        layout === "single" && "grid gap-3",
        layout === "split" && "grid gap-3 sm:grid-cols-2",
        layout === "inline" && "flex flex-wrap justify-end gap-3",
        className,
      )}
      style={{ borderColor: "var(--border-color)", ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

// Made with Bob
