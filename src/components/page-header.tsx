import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  headingId?: string;
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function PageHeader({
  title,
  description,
  headingId,
  children,
  className,
  innerClassName,
}: PageHeaderProps) {
  const content = children ?? (
    <>
      {title ? (
        <h1
          id={headingId}
          className="text-balance text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-[2rem]"
        >
          {title}
        </h1>
      ) : null}
      {description ? (
        <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "relative -mx-4 mb-8 border-b bg-page-header px-4 pb-8 pt-12 sm:-mx-6 sm:px-6",
        className,
      )}
    >
      <header className={cn("relative z-10 max-w-2xl", innerClassName)}>
        {content}
      </header>
    </div>
  );
}
