import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Staff access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect your staff wallet using “Connect wallet” at the top right to
          access the admin dashboard.
        </p>
      </div>
    );
  }

  if (user.role !== "staff_admin") {
    redirect("/");
  }

  return (
    <div className="border-b bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
        <Link
          href="/admin"
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          Arcademy Admin
        </Link>
      </div>
      <div className="min-h-[60vh] bg-background">{children}</div>
    </div>
  );
}
