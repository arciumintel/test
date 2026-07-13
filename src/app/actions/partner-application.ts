"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isPartnerIntakeAvailable, prisma } from "@/lib/prisma";
import { authorizeStaff, authorizeUser, toActionError } from "@/lib/access-control";
import { trackEventFireAndForget } from "@/lib/analytics-events";

import { uniqueProductSlug } from "@/lib/slugs";

type Result<T = unknown> = ({ ok: true } & T) | { error: string };

const PENDING_APPLICATION_STATUSES = ["received", "in_review"] as const;

const applicationSchema = z.object({
  partnerName: z.string().min(2, "Partner name is required").max(120),
  contactName: z.string().min(2, "Contact name is required").max(120),
  contactEmail: z
    .string()
    .email("Enter a valid email")
    .max(200),
  projectName: z.string().min(2, "Project name is required").max(120),
  projectDescription: z
    .string()
    .min(10, "Provide a short project description")
    .max(800),
  sourceMaterialUrl: z
    .union([z.string().url().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : null)),
  requestedCourseTopic: z.string().max(400).optional().nullable(),
});

export type PartnerApplicationStatus = {
  hasPartnerAccess: boolean;
  pendingApplication: {
    id: string;
    partnerName: string;
    projectName: string | null;
    reviewStatus: string;
    createdAt: string;
  } | null;
};

export async function getMyPartnerApplicationStatus(): Promise<PartnerApplicationStatus> {
  const auth = await authorizeUser();
  if (!auth.ok) {
    return { hasPartnerAccess: false, pendingApplication: null };
  }
  const user = auth.user;

  const adminCount = await prisma.projectAdmin.count({
    where: { userId: user.id },
  });
  if (adminCount > 0 || user.role === "staff_admin") {
    return { hasPartnerAccess: true, pendingApplication: null };
  }

  if (!isPartnerIntakeAvailable()) {
    return { hasPartnerAccess: false, pendingApplication: null };
  }

  const pending = await prisma.partnerIntake.findFirst({
    where: {
      applicantUserId: user.id,
      productId: null,
      reviewStatus: { in: [...PENDING_APPLICATION_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      partnerName: true,
      projectName: true,
      reviewStatus: true,
      createdAt: true,
    },
  });

  return {
    hasPartnerAccess: false,
    pendingApplication: pending
      ? {
          id: pending.id,
          partnerName: pending.partnerName,
          projectName: pending.projectName,
          reviewStatus: pending.reviewStatus,
          createdAt: pending.createdAt.toISOString(),
        }
      : null,
  };
}

export async function submitPartnerApplication(
  raw: z.input<typeof applicationSchema>
): Promise<Result<{ id: string }>> {
  const auth = await authorizeUser("Connect your wallet to apply as a partner.");
  if (!auth.ok) return { error: auth.message };
  const user = auth.user;

  if (user.role === "staff_admin") {
    return { error: "Staff accounts already have full admin access." };
  }

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const adminCount = await prisma.projectAdmin.count({
    where: { userId: user.id },
  });
  if (adminCount > 0) {
    return { error: "You already have partner access. Open the Partner console." };
  }

  if (!isPartnerIntakeAvailable()) {
    return {
      error:
        "Partner applications are temporarily unavailable. Please try again later.",
    };
  }

  const existingPending = await prisma.partnerIntake.findFirst({
    where: {
      applicantUserId: user.id,
      productId: null,
      reviewStatus: { in: [...PENDING_APPLICATION_STATUSES] },
    },
    select: { id: true },
  });
  if (existingPending) {
    return {
      error:
        "You already have a pending application. Arcademy staff will review it soon.",
    };
  }

  try {
    const intake = await prisma.partnerIntake.create({
      data: {
        applicantUserId: user.id,
        partnerName: parsed.data.partnerName,
        contactName: parsed.data.contactName,
        contactEmail: parsed.data.contactEmail,
        projectName: parsed.data.projectName,
        projectDescription: parsed.data.projectDescription,
        sourceMaterialUrl: parsed.data.sourceMaterialUrl,
        requestedCourseTopic: parsed.data.requestedCourseTopic?.trim() || null,
        reviewStatus: "received",
      },
    });

    trackEventFireAndForget({
      eventName: "partner_application_submitted",
      source: "server_action",
      path: "/partners/apply",
      userId: user.id,
      metadata: {
        intakeId: intake.id,
        partnerName: intake.partnerName,
        projectName: intake.projectName,
      },
    });

    revalidatePath("/admin/partner-intake");
    revalidatePath("/partners/apply");
    revalidatePath("/partner-console");
    return { ok: true, id: intake.id };
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2021") {
      return {
        error:
          "Partner intake is not available yet. Please contact Arcademy staff.",
      };
    }
    throw e;
  }
}

export async function approvePartnerApplication(
  intakeId: string
): Promise<Result<{ productId: string }>> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);
  const staff = auth.user;

  const intake = await prisma.partnerIntake.findUnique({
    where: { id: intakeId },
    include: {
      applicant: { select: { id: true, walletAddress: true } },
    },
  });

  if (!intake) return { error: "Application not found." };
  if (!intake.applicantUserId || !intake.applicant) {
    return { error: "This intake is not a self-serve partner application." };
  }
  if (intake.productId) {
    return { error: "This application has already been approved." };
  }
  if (!intake.projectName?.trim()) {
    return { error: "Application is missing an ecosystem project name." };
  }

  const product = await prisma.product.create({
    data: {
      name: intake.projectName.trim(),
      slug: await uniqueProductSlug(intake.projectName),
      description:
        intake.projectDescription?.trim() ||
        `Ecosystem project for ${intake.partnerName}.`,
      partnerName: intake.partnerName,
      status: "draft",
    },
  });

  const { ensureAnalyticsProfileForProduct } = await import(
    "@/lib/analytics-profile"
  );
  await ensureAnalyticsProfileForProduct(product.id);

  await prisma.projectAdmin.upsert({
    where: {
      productId_userId: {
        productId: product.id,
        userId: intake.applicantUserId,
      },
    },
    create: {
      productId: product.id,
      userId: intake.applicantUserId,
      role: "owner",
      invitedByUserId: staff.id,
    },
    update: {
      role: "owner",
      invitedByUserId: staff.id,
    },
  });

  await prisma.partnerIntake.update({
    where: { id: intakeId },
    data: {
      productId: product.id,
      reviewStatus: "approved",
    },
  });

  trackEventFireAndForget({
    eventName: "partner_application_approved",
    source: "admin",
    path: `/admin/partner-intake/${intakeId}`,
    userId: staff.id,
    ecosystemProjectId: product.id,
    ecosystemProjectSlug: product.slug,
    metadata: {
      intakeId,
      applicantUserId: intake.applicantUserId,
      applicantWallet: intake.applicant.walletAddress,
    },
  });

  revalidatePath("/admin/partner-intake");
  revalidatePath(`/admin/partner-intake/${intakeId}`);
  revalidatePath("/partner-console");
  revalidatePath("/partners/apply");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${product.id}`);
  return { ok: true, productId: product.id };
}

export async function rejectPartnerApplication(
  intakeId: string,
  notes?: string | null
): Promise<Result> {
  const auth = await authorizeStaff();
  if (!auth.ok) return toActionError(auth);

  const intake = await prisma.partnerIntake.findUnique({
    where: { id: intakeId },
    select: {
      id: true,
      applicantUserId: true,
      productId: true,
      reviewStatus: true,
      notes: true,
    },
  });

  if (!intake) return { error: "Application not found." };
  if (!intake.applicantUserId) {
    return { error: "This intake is not a self-serve partner application." };
  }
  if (intake.productId) {
    return { error: "This application has already been approved." };
  }

  const rejectionNote = notes?.trim()
    ? `[Rejected ${new Date().toISOString().slice(0, 10)}] ${notes.trim()}`
    : `[Rejected ${new Date().toISOString().slice(0, 10)}]`;

  await prisma.partnerIntake.update({
    where: { id: intakeId },
    data: {
      reviewStatus: "rejected",
      notes: intake.notes
        ? `${intake.notes}\n\n${rejectionNote}`
        : rejectionNote,
    },
  });

  revalidatePath("/admin/partner-intake");
  revalidatePath(`/admin/partner-intake/${intakeId}`);
  revalidatePath("/partners/apply");
  return { ok: true };
}
