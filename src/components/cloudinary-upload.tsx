"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, Loader2, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  productId?: string;
};

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
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
          <Image src={value} alt="Uploaded asset" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow hover:bg-background cursor-pointer"
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
          className="flex aspect-[16/9] w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-60 cursor-pointer"
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

      <div className="flex items-center gap-2">
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
        <span className="text-xs text-muted-foreground">or paste a URL below</span>
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

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
