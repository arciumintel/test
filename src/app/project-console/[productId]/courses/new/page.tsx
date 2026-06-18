import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CourseDetailsForm } from "@/components/admin/course-details-form";
import { getProjectAdminAccess } from "@/lib/project-admin";
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
  return { title: product ? `New course — ${product.name}` : "New course draft" };
}

export default async function NewPartnerCoursePage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const access = await getProjectAdminAccess(productId);
  if (!access.user) redirect("/courses");
  if (!access.canManage) redirect("/project-console");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, status: true },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/project-console/${productId}/courses`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Course drafts
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New course draft</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a course for {product.name}. After authoring, submit it for Arcademy
        staff review before it can go live.
      </p>
      <div className="mt-8">
        <CourseDetailsForm
          products={[{ id: product.id, name: product.name, status: product.status }]}
          variant="partner"
          partnerProductId={productId}
          coursePathPrefix={`/project-console/${productId}/courses`}
        />
      </div>
    </div>
  );
}
