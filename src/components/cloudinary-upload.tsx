"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormError,
  FormField,
  FormHelperText,
  FormLabel,
} from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  productId?: string;
};

function isCloudinaryUrl(url: string) {
  try {
    return new URL(url).hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

/**
 * Signed, direct-to-Cloudinary upload. We only ever keep the returned
 * secure_url; the file never passes through our own server.
 */
export function CloudinaryUpload({ value, onChange, label, className, productId }: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productId ? { productId } : {}),
      });
      if (!signRes.ok) {
        const body = await signRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not start upload.");
      }
      const { signature, timestamp, apiKey, cloudName, folder } =
        await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: form }
      );
      const data = await uploadRes.json();
      if (!uploadRes.ok || !data.secure_url) {
        throw new Error(data.error?.message ?? "Upload failed.");
      }
      onChange(data.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormField className={cn(className)}>
      {label ? <FormLabel>{label}</FormLabel> : null}

      {value ? (
        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-xl border bg-input-background">
          {isCloudinaryUrl(value) ? (
            <Image
              src={value}
              alt="Uploaded asset"
              fill
              sizes="(max-width: 640px) 100vw, 24rem"
              className="object-cover"
            />
          ) : (
            // Arbitrary pasted URLs are not in next.config remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Uploaded asset"
              className="absolute inset-0 size-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/95 text-foreground transition-colors hover:bg-background cursor-pointer"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex aspect-[16/9] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-input-background/50 text-muted-foreground transition-colors hover:border-foreground/25 hover:bg-input-background disabled:opacity-60 cursor-pointer"
        >
          {busy ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <ImageIcon className="size-6" />
          )}
          <span className="text-sm">
            {busy ? "Uploading…" : "Click to upload an image"}
          </span>
        </button>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload />
          {value ? "Replace" : "Upload"}
        </Button>
        <FormHelperText>or paste a URL below</FormHelperText>
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://res.cloudinary.com/…"
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error ? <FormError>{error}</FormError> : null}
    </FormField>
  );
}
