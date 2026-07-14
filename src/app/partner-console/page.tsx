import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Handshake,
  BarChart3,
  MessageCircle,
  Settings,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeSectionLoadError } from "@/components/home-section-load-error";
import { PartnerConnectPrompt } from "@/components/partner-connect-prompt";
import { PageHeader } from "@/components/page-header";
import { getMyPartnerApplicationStatus } from "@/app/actions/partner-application";
import { getCurrentUser } from "@/lib/session";
import { getManagedProducts } from "@/lib/project-admin";
import {
  partnerConsoleDefaultPath,
  safePartnerConsolePath,
} from "@/lib/partner-console-paths";

export const metadata = { title: "Partner console" };

export default async function PartnerConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  const { access, next } = await searchParams;
  const returnPath = safePartnerConsolePath(next);

  if (user && returnPath) {
    redirect(returnPath);
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
        <PageHeader
          headingId="partner-console-heading"
          title="Partner console"
          description="Manage project settings, course drafts, analytics, and Discord role grants for projects you administer."
        />
        <section aria-labelledby="partner-console-heading">
          <PartnerConnectPrompt returnPath={returnPath} />
        </section>
      </div>
    );
  }

  const isStaff = user.role === "staff_admin";
  let products: Awaited<ReturnType<typeof getManagedProducts>> = [];
  let productsLoadError = false;

  try {
    products = await getManagedProducts(user.id, isStaff);
  } catch {
    productsLoadError = true;
  }

  if (!isStaff && products.length === 0 && !productsLoadError) {
    const status = await getMyPartnerApplicationStatus();

    if (status.pendingApplication) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <ClipboardList
            className="mx-auto size-10 text-muted-foreground"
            aria-hidden
          />
          <h1 className="mt-4 text-xl font-semibold">Partner console</h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground">
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
        <Handshake
          className="mx-auto size-10 text-muted-foreground"
          aria-hidden
        />
        <h1 className="mt-4 text-xl font-semibold">Partner console</h1>
        <p className="mt-2 text-pretty text-sm text-muted-foreground">
          Apply to become an Arcademy partner and manage your project, courses,
          and Discord integration.
        </p>
        <Button asChild className="mt-6">
          <Link href="/partners/apply">Become a partner</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
      <PageHeader>
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Partner console
        </h1>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
          Choose a project to manage. Start with project settings and course
          drafts, then configure Discord when you are ready.{" "}
          <Link
            href="/partners/docs"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Partner handbook
          </Link>
        </p>
      </PageHeader>

      {access === "denied" && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            You do not have permission to manage that project.
          </AlertDescription>
        </Alert>
      )}

      {productsLoadError ? (
        <div className="mt-8">
          <HomeSectionLoadError
            title="Projects did not load"
            description="Your partner projects are unavailable right now. Refresh the page, or try again in a few minutes."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {products.map((product) => {
            const defaultPath = partnerConsoleDefaultPath(product.id);
            const hasPublishedCourses = product._count.courses > 0;

            return (
              <Card key={product.id}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{product.name}</p>
                      <Badge variant="secondary" className="capitalize">
                        {product.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-pretty text-sm text-muted-foreground">
                      {product.projectDiscordIntegration
                        ? `Discord connected: ${product.projectDiscordIntegration.guildName} (${product.projectDiscordIntegration.status})`
                        : "Discord not configured yet"}
                    </p>
                    <p className="mt-2 text-pretty text-xs text-muted-foreground">
                      New here? Update project settings, then open course drafts
                      to author and publish content.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Button asChild>
                      <Link href={defaultPath}>
                        <BookOpen className="size-4" />
                        Manage project
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/partner-console/${product.id}/project`}>
                          <Settings className="size-4" />
                          Settings
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/partner-console/${product.id}/discord`}>
                          <MessageCircle className="size-4" />
                          Discord
                        </Link>
                      </Button>
                      {hasPublishedCourses && (
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/partner-console/${product.id}/analytics`}
                          >
                            <BarChart3 className="size-4" />
                            Analytics
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
