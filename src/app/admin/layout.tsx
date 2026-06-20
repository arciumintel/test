import Link from "next/link";
import { AdminAccessDenied, AdminStaffConnectPrompt } from "@/components/admin/admin-staff-gates";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <AdminStaffConnectPrompt />;
  }

  if (user.role !== "staff_admin") {
    return <AdminAccessDenied />;
  }

  return (
    <div className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 pt-3 sm:px-6">
        <Link
          href="/admin"
          className="text-sm font-semibold tracking-tight text-foreground hover:text-primary"
        >
          Arcademy Admin
        </Link>
        <div className="mt-3">
          <AdminNav />
        </div>
      </div>
      <div className="min-h-[60vh] bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
