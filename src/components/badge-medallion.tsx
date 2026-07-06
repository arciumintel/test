import Image from "next/image";
import { SealBadge } from "@/components/seal-badge";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** Animate seal on badge-earn / quiz-pass moments */
  celebrate?: boolean;
};

export function BadgeMedallion({
  name,
  imageUrl,
  size = "md",
  className,
  celebrate = false,
}: Props) {
  const dim = size === "md" ? "size-20" : "size-12";
  const sealSize = size === "md" ? "md" : "sm";

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-earned-background ring-2 ring-earned-border",
          dim,
          celebrate && "quiz-pass-celebrate",
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="80px"
          className="rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <SealBadge
      label={name}
      size={sealSize}
      celebrate={celebrate}
      className={className}
    />
  );
}
