import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function FormActions({
  className,
  sticky = false,
  children,
  ...props
}: React.ComponentProps<"div"> & { sticky?: boolean }) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "flex flex-wrap items-center gap-3 border-t border-border/60 pt-6",
        sticky &&
          "surface-nav sticky bottom-0 z-20 -mx-8 border-t px-8 pb-6 pt-4 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function FormSaveStatus({
  saved,
  error,
  className,
}: {
  saved?: boolean;
  error?: string | null;
  className?: string;
}) {
  if (!saved && !error) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {saved ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-success">
          <Check className="size-4" aria-hidden />
          Saved
        </span>
      ) : null}
      {error ? (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function FormSubmitButton({
  busy,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { busy?: boolean }) {
  return (
    <Button type="submit" disabled={busy || props.disabled} className={className} {...props}>
      {busy ? <Loader2 className="animate-spin" aria-hidden /> : children}
    </Button>
  );
}

export { FormActions, FormSaveStatus, FormSubmitButton };
