import "server-only";

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
