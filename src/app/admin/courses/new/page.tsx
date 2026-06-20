import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CourseDetailsForm } from "@/components/admin/course-details-form";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@prisma/client";

type ProductOption = {
  id: string;
  name: string;
  status: ProductStatus;
};

export default async function NewCoursePage() {
  let products: ProductOption[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true },
    });
  } catch {
    products = [];
  }

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        New course
      </h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Start with the basics. You can add lessons, a quiz, and a badge after
        creating the course.
      </p>
      <div className="mx-auto mt-8 max-w-3xl">
        <CourseDetailsForm products={products} />
      </div>
    </>
  );
}
