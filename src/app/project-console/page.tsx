import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";
import { getManagedProducts } from "@/lib/project-admin";

export const metadata = { title: "Project console" };

export default async function ProjectConsolePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/courses");

  const isStaff = user.role === "staff_admin";
  const products = await getManagedProducts(user.id, isStaff);

  if (!isStaff && products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <MessageCircle className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Project console</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not manage any ecosystem projects yet. Ask Arcademy staff to assign
          your wallet as a project admin.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Project console</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage Discord role grants for projects you administer.
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
              <Button asChild variant="outline">
                <Link href={`/project-console/${product.id}/discord`}>
                  <MessageCircle className="size-4" />
                  Discord setup
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
