import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Handshake,
  MessageCircle,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMyPartnerApplicationStatus } from "@/app/actions/partner-application";
import { getCurrentUser } from "@/lib/session";
import { getManagedProducts } from "@/lib/project-admin";

export const metadata = { title: "Partner console" };

export default async function PartnerConsolePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/courses");

  const isStaff = user.role === "staff_admin";
  const products = await getManagedProducts(user.id, isStaff);

  if (!isStaff && products.length === 0) {
    const status = await getMyPartnerApplicationStatus();

    if (status.pendingApplication) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <ClipboardList className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Partner console</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your application for{" "}
            <strong>{status.pendingApplication.projectName}</strong> is pending
            review. Arcademy staff will notify you when approved.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Handshake className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Partner console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply to become an Arcademy partner and manage your ecosystem project,
          courses, and Discord integration.
        </p>
        <Button asChild className="mt-6">
          <Link href="/partners/apply">Become a partner</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Partner console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage project settings, course drafts, partner self-service, materials,
        and Discord role grants for projects you administer.
      </p>

      <div className="mt-8 grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{product.name}</p>
                  <Badge variant="secondary" className="capitalize">
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.projectDiscordIntegration
                    ? `Discord: ${product.projectDiscordIntegration.guildName} (${product.projectDiscordIntegration.status})`
                    : "Discord not configured"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/partner-console/${product.id}/project`}>
                    <Settings className="size-4" />
                    Project settings
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/partner-console/${product.id}/courses`}>
                    <BookOpen className="size-4" />
                    Course drafts
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/partner-console/${product.id}/self-service`}>
                    <ClipboardList className="size-4" />
                    Self-service
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/partner-console/${product.id}/discord`}>
                    <MessageCircle className="size-4" />
                    Discord setup
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
