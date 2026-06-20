import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Projects
      </Link>
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        New project
      </h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Create a project page before assigning courses to it.
      </p>
      <div className="mx-auto mt-8 max-w-3xl">
        <ProductForm />
      </div>
    </>
  );
}
