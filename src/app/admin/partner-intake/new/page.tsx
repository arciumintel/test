import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PartnerIntakeForm } from "@/components/admin/partner-intake-form";
import { prisma } from "@/lib/prisma";

export default async function NewPartnerIntakePage() {
  let products: { id: string; name: string }[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    products = [];
  }

  return (
    <>
      <Link
        href="/admin/partner-intake"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Partner intake
      </Link>
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        New partner intake
      </h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        See{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          docs/partner_intake_template.md
        </code>{" "}
        for the full intake checklist.
      </p>
      <div className="mx-auto mt-8 max-w-3xl">
        <PartnerIntakeForm products={products} />
      </div>
    </>
  );
}
