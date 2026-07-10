import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  headingId?: string;
  children?: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  headingId,
  children,
  className,
  innerClassName,
}: PageHeaderProps) {
  const content = children ?? (
    <>
      {eyebrow ? (
        <p className="section-eyebrow mb-2">{eyebrow}</p>
      ) : null}
      {title ? (
        <h1
          id={headingId}
          className="text-balance text-[1.875rem] font-semibold leading-tight tracking-tight sm:text-[2.25rem]"
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
        "relative -mx-4 mb-8 border-b bg-page-header px-4 pb-10 pt-14 sm:-mx-6 sm:px-6 sm:pb-12 sm:pt-16",
        className,
      )}
    >
      <header className={cn("relative z-10 max-w-2xl", innerClassName)}>
        {content}
      </header>
    </div>
  );
}
