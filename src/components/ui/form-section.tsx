import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function FormSection({
  title,
  description,
  className,
  contentClassName,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card data-slot="form-section" className={cn("shadow-none", className)}>
      {(title || description) && (
        <CardHeader className="pb-0">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      )}
      <CardContent className={cn("space-y-6 pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export { FormSection };
