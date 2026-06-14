import { Badge } from "@/components/ui/badge";
import { BarChart, Signal, Zap } from "lucide-react";
import type { CourseLevel } from "@prisma/client";

const MAP: Record<
  CourseLevel,
  { label: string; icon: React.ElementType; variant: "muted" | "secondary" }
> = {
  beginner: { label: "Beginner", icon: Zap, variant: "secondary" },
  intermediate: { label: "Intermediate", icon: Signal, variant: "secondary" },
  advanced: { label: "Advanced", icon: BarChart, variant: "secondary" },
};

export function LevelBadge({ level }: { level: CourseLevel }) {
  const { label, icon: Icon, variant } = MAP[level];
  return (
    <Badge variant={variant} className="capitalize">
      <Icon />
      {label}
    </Badge>
  );
}
