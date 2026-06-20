"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type HomeSectionLoadErrorProps = {
  title: string;
  description: string;
};

export function HomeSectionLoadError({
  title,
  description,
}: HomeSectionLoadErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{description}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => window.location.reload()}
        >
          Refresh page
        </Button>
      </AlertDescription>
    </Alert>
  );
}
