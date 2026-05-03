import {
  forwardRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "./utils";

interface FieldProps {
  children: ReactNode;
  error?: string;
  helperText?: string;
  label: ReactNode;
  labelProps?: LabelHTMLAttributes<HTMLLabelElement>;
}

const controlClassName =
  "w-full rounded-lg border border-[var(--border-color)] bg-[var(--surface-secondary)] px-3 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] disabled:cursor-not-allowed disabled:bg-[var(--surface-disabled)] disabled:text-[var(--text-disabled)] disabled:opacity-60";

export function Field({
  children,
  error,
  helperText,
  label,
  labelProps,
}: FieldProps) {
  return (
    <label className="block" {...labelProps}>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {helperText && !error && (
        <span
          className="mt-1 block text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          {helperText}
        </span>
      )}
      {error && (
        <span className="mt-1 block text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input ref={ref} className={cn(controlClassName, className)} {...props} />
  );
});

Input.displayName = "Input";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => {
  return (
    <select ref={ref} className={cn(controlClassName, className)} {...props} />
  );
});

Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(controlClassName, "resize-none", className)}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

interface ToggleRowProps {
  checked: boolean;
  description?: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({
  checked,
  description,
  disabled = false,
  label,
  onChange,
}: ToggleRowProps) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4"
      style={{
        backgroundColor: "var(--surface-secondary)",
        borderColor: "var(--border-subtle)",
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description && (
          <span
            className="block text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            {description}
          </span>
        )}
      </span>
      <span
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full"
        style={{
          backgroundColor: checked
            ? "var(--primary)"
            : "var(--surface-tertiary)",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className="inline-block h-5 w-5 rounded-full transition-transform"
          style={{
            backgroundColor: "var(--control-knob)",
            transform: checked ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </span>
    </label>
  );
}

// Made with Bob
