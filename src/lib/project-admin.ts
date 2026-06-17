import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireStaff, requireUser } from "@/lib/session";

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

export async function requireProjectAdmin(productId: string) {
  const user = await requireUser();
  if (user.role === "staff_admin") return user;

  const allowed = await isProjectAdmin(user.id, productId);
  if (!allowed) throw new Error("FORBIDDEN");
  return user;
}

export async function getManagedProducts(userId: string, isStaff: boolean) {
  if (isStaff) {
    return prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        projectDiscordIntegration: {
          select: { id: true, status: true, guildName: true },
        },
      },
    });
  }

  const admins = await prisma.projectAdmin.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          projectDiscordIntegration: {
            select: { id: true, status: true, guildName: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return admins.map((a) => a.product);
}

export async function getProjectAdminAccess(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { user: null, canManage: false, isStaff: false };

  const isStaff = user.role === "staff_admin";
  const canManage =
    isStaff || (await isProjectAdmin(user.id, productId));

  return { user, canManage, isStaff };
}

export async function requireStaffOrProjectAdmin(productId: string) {
  try {
    return await requireProjectAdmin(productId);
  } catch {
    await requireStaff();
    return requireUser();
  }
}
