import Image from "next/image";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export function BadgeMedallion({
  name,
  imageUrl,
  size = "md",
  className,
}: Props) {
  const dim = size === "md" ? "size-20" : "size-12";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-warning/25 to-warning/5 ring-2 ring-warning/25",
        dim,
        className
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="80px"
          className="rounded-full object-cover"
        />
      ) : (
        <Award className={size === "md" ? "size-9 text-warning" : "size-6 text-warning"} />
      )}
    </div>
  );
}
