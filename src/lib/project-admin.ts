import "server-only";

import { prisma } from "@/lib/prisma";
import { authorizeProjectAdmin, authorizeStaffOrProjectAdmin } from "@/lib/access-control";
import { getProjectAdminRole, isProjectAdmin } from "@/lib/project-admin-access";
import { getCurrentUser } from "@/lib/session";

export { isProjectAdmin } from "@/lib/project-admin-access";

export async function requireProjectAdmin(productId: string) {
  const auth = await authorizeProjectAdmin(productId);
  if (!auth.ok) {
    throw new Error(
      auth.reason === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN"
    );
  }
  return auth.user;
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
        _count: {
          select: {
            courses: { where: { status: "published" } },
          },
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
          _count: {
            select: {
              courses: { where: { status: "published" } },
            },
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
  if (!user) {
    return {
      user: null,
      canManage: false,
      isStaff: false,
      projectRole: null,
      analyticsLevel: null,
    };
  }

  const isStaff = user.role === "staff_admin";
  if (isStaff) {
    return {
      user,
      canManage: true,
      isStaff: true,
      projectRole: null,
      analyticsLevel: "platform_admin" as const,
    };
  }

  const projectRole = await getProjectAdminRole(user.id, productId);
  const canManage = Boolean(projectRole);

  return {
    user,
    canManage,
    isStaff: false,
    projectRole,
    analyticsLevel: projectRole,
  };
}

export async function requireStaffOrProjectAdmin(productId: string) {
  const auth = await authorizeStaffOrProjectAdmin(productId);
  if (!auth.ok) {
    throw new Error(
      auth.reason === "unauthenticated" ? "UNAUTHENTICATED" : "FORBIDDEN"
    );
  }
  return auth.user;
}
