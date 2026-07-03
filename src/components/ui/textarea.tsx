import * as React from "react";
import { cn } from "@/lib/utils";
import { textareaControlClasses } from "@/lib/form-styles";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaControlClasses, className)}
      {...props}
    />
  );
}

export { Textarea };
