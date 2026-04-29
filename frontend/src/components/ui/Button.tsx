"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
} from "react";
import {
  cn,
  dangerButtonStyle,
  ghostButtonStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleButtonStyle,
} from "./utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: primaryButtonStyle,
  secondary: secondaryButtonStyle,
  ghost: ghostButtonStyle,
  danger: dangerButtonStyle,
  subtle: subtleButtonStyle,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-sm",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-11 px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      size = "md",
      style,
      variant = "secondary",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-55",
          sizeClasses[size],
          className,
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {isLoading ? "Loading..." : children}
      </button>
    );
  },
);

Button.displayName = "Button";

// Made with Bob
