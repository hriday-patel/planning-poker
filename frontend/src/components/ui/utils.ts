export const cn = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter(Boolean).join(" ");
};

export const primaryButtonStyle = {
  backgroundColor: "var(--primary)",
  backgroundImage: "none",
  color: "var(--text-on-accent)",
  boxShadow: "none",
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
