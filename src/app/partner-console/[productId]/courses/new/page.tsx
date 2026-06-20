import { notFound } from "next/navigation";
import { CourseDetailsForm } from "@/components/admin/course-details-form";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true },
  });
  return { title: product ? `New course: ${product.name}` : "New course draft" };
}

export default async function NewPartnerCoursePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true },
  });
  if (!product) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">New course draft</h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Create a course for {product.name}. After authoring, submit it for
        Arcademy staff review before it can go live.
      </p>
      <div className="mt-8 max-w-3xl">
        <CourseDetailsForm
          products={[{ id: product.id, name: product.name, status: product.status }]}
          variant="partner"
          partnerProductId={productId}
          coursePathPrefix={`/partner-console/${productId}/courses`}
        />
      </div>
    </>
  );
}
