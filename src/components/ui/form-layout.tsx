import * as React from "react";
import { cn } from "@/lib/utils";

/** Major form sections: 48px apart, max width ~960px */
function FormLayout({
  className,
  children,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form
      data-slot="form-layout"
      className={cn("mx-auto w-full max-w-[960px] space-y-12", className)}
      {...props}
    >
      {children}
    </form>
  );
}

function FormStack({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="form-stack"
      className={cn("mx-auto w-full max-w-[960px] space-y-12", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { FormLayout, FormStack };
