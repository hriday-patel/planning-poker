import { type HTMLAttributes } from "react";
import { cn } from "./utils";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({
  className,
  imageUrl,
  name,
  size = "md",
  ...props
}: AvatarProps) {
  const fallback = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white shadow-sm",
        sizeClasses[size],
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
      }}
      title={name}
      {...props}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}

// Made with Bob
