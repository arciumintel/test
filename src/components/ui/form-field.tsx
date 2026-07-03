import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Label → control spacing: 8px */
function FormField({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-field"
      className={cn("grid gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return <Label className={className} {...props} />;
}

function FormHelperText({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-helper"
      className={cn("text-[13px] leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function FormError({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-error"
      role="alert"
      className={cn("text-[13px] leading-relaxed text-destructive", className)}
      {...props}
    />
  );
}

/** Field groups within a section: 24px apart */
function FormFieldGroup({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-field-group"
      className={cn("grid gap-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { FormField, FormLabel, FormHelperText, FormError, FormFieldGroup };
