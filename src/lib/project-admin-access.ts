import "server-only";

import type { ProjectAdminRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function isProjectAdmin(
  userId: string,
  productId: string
): Promise<boolean> {
  const admin = await prisma.projectAdmin.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { id: true },
  });
  return Boolean(admin);
}

export async function getProjectAdminRole(
  userId: string,
  productId: string
): Promise<ProjectAdminRole | null> {
  const admin = await prisma.projectAdmin.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { role: true },
  });
  return admin?.role ?? null;
}
