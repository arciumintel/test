"use client";

import * as React from "react";

/**
 * Minimal Slot: merges its props/className onto a single child element.
 * Lets components like Button render `asChild` (e.g. wrapping a Next <Link>)
 * without pulling in @radix-ui/react-slot.
 */
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Slot({ children, ...props }, ref) {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;

    const mergedClassName = [
      (props as { className?: string }).className,
      childProps.className as string | undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: mergedClassName || undefined,
      ref,
    });
  }
);
