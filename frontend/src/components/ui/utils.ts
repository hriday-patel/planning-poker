export const cn = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

export const primaryButtonStyle = {
  background:
    "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
  color: "white",
  boxShadow:
    "0 16px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
} as const;

export const secondaryButtonStyle = {
  backgroundColor: "var(--surface-secondary)",
  borderColor: "var(--border-color)",
  color: "var(--text-primary)",
} as const;

export const ghostButtonStyle = {
  backgroundColor: "transparent",
  borderColor: "transparent",
  color: "var(--text-secondary)",
} as const;

export const dangerButtonStyle = {
  backgroundColor: "var(--danger-bg)",
  borderColor: "var(--danger)",
  color: "var(--danger)",
} as const;

export const subtleButtonStyle = {
  backgroundColor: "var(--surface-tertiary)",
  borderColor: "var(--border-subtle)",
  color: "var(--text-secondary)",
} as const;

// Made with Bob
