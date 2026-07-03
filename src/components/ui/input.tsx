import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldControlClasses, fieldHeightClasses } from "@/lib/form-styles";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldControlClasses,
        fieldHeightClasses,
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Input };
