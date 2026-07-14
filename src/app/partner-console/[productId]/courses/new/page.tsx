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
      <h1 className="text-2xl font-semibold tracking-tight">New course</h1>
      <p className="mt-1 text-pretty text-sm text-muted-foreground">
        Create a course for {product.name}. When it is ready, publish it from
        the course editor.
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
