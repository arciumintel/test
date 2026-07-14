import type { ReactNode } from "react";
import { PageHeaderAtmosphere } from "@/components/page-header-atmosphere";
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
        "page-header relative isolate mt-6 -mx-4 mb-8 overflow-hidden border-b px-4 pb-8 pt-8 sm:-mx-6 sm:px-6",
        className,
      )}
    >
      <PageHeaderAtmosphere />
      <header className={cn("relative max-w-2xl", innerClassName)}>
        {content}
      </header>
    </div>
  );
}
