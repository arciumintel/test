import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Products
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a product page before assigning courses to it.
      </p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
