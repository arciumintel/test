import { cn } from "@/lib/utils";

/** Shared control styles for inputs, selects, and similar fields. */
export const fieldControlClasses = cn(
  "flex w-full min-w-0 rounded-xl border border-input bg-input-background px-4 text-[15px] leading-normal shadow-none transition-[color,box-shadow,background-color,border-color]",
  "placeholder:text-muted-foreground/80",
  "hover:border-foreground/25",
  "focus-visible:outline-none focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/20",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
);

export const fieldHeightClasses = "h-12 min-h-12";

export const textareaControlClasses = cn(
  fieldControlClasses,
  "min-h-32 resize-y py-3.5",
);
