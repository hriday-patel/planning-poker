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

type IconButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "subtle";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, CSSProperties> = {
  primary: primaryButtonStyle,
  secondary: secondaryButtonStyle,
  ghost: ghostButtonStyle,
  danger: dangerButtonStyle,
  subtle: subtleButtonStyle,
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      disabled,
      size = "md",
      style,
      variant = "secondary",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-55",
          sizeClasses[size],
          className,
        )}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  },
);

IconButton.displayName = "IconButton";

// Made with Bob
