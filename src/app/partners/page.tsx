import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Partner with Arcademy to educate Arcium ecosystem users through curated, structured courses.",
};

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Handshake className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Partner with Arcademy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Give your ecosystem project a trusted learning destination for user
            onboarding.
          </p>
        </div>
      </div>

      <p className="mt-8 text-pretty leading-relaxed text-muted-foreground">
        Arcademy helps Arcium ecosystem projects educate users through curated,
        structured courses. After approval, partners publish their own project
        pages and courses from the Partner console. You get stable URLs,
        wallet-linked badges, and performance reporting — with Arcademy staff
        able to step in on quality when needed.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/partners/docs">
            <BookOpen />
            Read the handbook
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/partners/apply">
            Apply to partner
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Professional ecosystem project page</li>
              <li>Curated beginner-friendly course</li>
              <li>Partner console for courses and analytics</li>
              <li>Stable referral URLs for docs and onboarding</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Apply with your project details and docs</li>
              <li>Staff approves and grants console access</li>
              <li>You publish your project page and courses</li>
              <li>Refer users and track aggregate performance</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
