import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletAuth } from "@/components/auth/wallet-auth";
import { PartnerApplicationForm } from "@/components/partners/partner-application-form";
import { getMyPartnerApplicationStatus } from "@/app/actions/partner-application";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Become a partner" };

export default async function PartnerApplyPage() {
  const user = await getCurrentUser();

  if (user?.role === "staff_admin") {
    redirect("/admin");
  }

  const status = user
    ? await getMyPartnerApplicationStatus()
    : { hasPartnerAccess: false, pendingApplication: null };

  if (status.hasPartnerAccess) {
    redirect("/partner-console");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Handshake className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Become an Arcademy partner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply to publish ecosystem learning content on Arcademy.{" "}
            <Link
              href="/partners/docs"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Read the partner handbook
            </Link>{" "}
            before you apply.
          </p>
        </div>
      </div>

      {!user ? (
        <div className="mt-10 rounded-xl border border-dashed bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Connect your Solana wallet to submit a partner application. Your
            wallet will be linked to your partner account after approval.
          </p>
          <div className="mt-6 flex justify-center">
            <WalletAuth authedWallet={null} />
          </div>
        </div>
      ) : status.pendingApplication ? (
        <div className="mt-10 rounded-xl border bg-muted/30 p-8 text-center">
          <h2 className="text-lg font-semibold">Application pending review</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your application for{" "}
            <strong>{status.pendingApplication.projectName}</strong> was
            submitted on{" "}
            {new Date(status.pendingApplication.createdAt).toLocaleDateString()}.
            Arcademy staff will review it and notify you when approved.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/courses">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10">
          <PartnerApplicationForm />
        </div>
      )}
    </div>
  );
}
