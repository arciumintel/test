"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type CourseCatalogFiltersMobileProps = {
  activeFilterCount: number;
  children: React.ReactNode;
};

/** Mobile-only sheet trigger; desktop filters render inline in the toolbar. */
export function CourseCatalogFiltersMobile({
  activeFilterCount,
  children,
}: CourseCatalogFiltersMobileProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 w-full sm:w-auto",
            activeFilterCount > 0 &&
              "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filter & sort
          {activeFilterCount > 0 && (
            <Badge className="ml-1.5 border-transparent bg-primary/15 text-primary hover:bg-primary/15">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Filter & sort courses</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
