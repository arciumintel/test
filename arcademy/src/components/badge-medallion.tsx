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
        "relative flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/20",
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
        <Award className={size === "md" ? "size-9 text-primary" : "size-6 text-primary"} />
      )}
    </div>
  );
}
