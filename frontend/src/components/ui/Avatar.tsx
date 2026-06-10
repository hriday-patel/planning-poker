import { type HTMLAttributes, useState } from "react";
import { cn } from "./utils";

const GUEST_AVATAR_PATH = "/images/guest-avatar.png";

const isPlaceholderAvatar = (imageUrl?: string | null) =>
  !imageUrl || imageUrl === GUEST_AVATAR_PATH;

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
  const [imageFailed, setImageFailed] = useState(false);
  const fallback = name.trim().charAt(0).toUpperCase() || "?";
  const showImage = !isPlaceholderAvatar(imageUrl) && !imageFailed;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold shadow-sm",
        sizeClasses[size],
        className,
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
        color: "var(--text-on-accent)",
      }}
      title={name}
      {...props}
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}

// Made with Bob
