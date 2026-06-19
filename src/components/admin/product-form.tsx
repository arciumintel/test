"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { createProduct, updateProduct } from "@/app/actions/admin-products";
import { updatePartnerProduct } from "@/app/actions/partner-products";

type ProductLink = {
  label: string;
  url: string;
};

type Initial = {
  id?: string;
  name: string;
  description: string;
  logoUrl: string | null;
  category: string | null;
  partnerName: string | null;
  links: ProductLink[];
};

export function ProductForm({
  initial,
  variant = "admin",
  partnerProductId,
}: {
  initial?: Initial;
  variant?: "admin" | "partner";
  partnerProductId?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(
    initial?.description ?? ""
  );
  const [logoUrl, setLogoUrl] = React.useState(initial?.logoUrl ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [partnerName, setPartnerName] = React.useState(initial?.partnerName ?? "");
  const [links, setLinks] = React.useState<ProductLink[]>(
    initial?.links?.length ? initial.links : [{ label: "", url: "" }]
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);

    const payload = {
      name,
      description,
      logoUrl: logoUrl || null,
      category: category || null,
      partnerName: partnerName || null,
      links: links.filter((link) => link.label.trim() && link.url.trim()),
    };

    const res =
      variant === "partner" && initial?.id && partnerProductId
        ? await updatePartnerProduct(partnerProductId, payload)
        : isEdit && initial?.id
          ? await updateProduct(initial.id, payload)
          : await createProduct(payload);

    setBusy(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    if (!isEdit && "id" in res) {
      router.push(`/admin/products/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {variant === "partner" && (
        <p className="text-sm text-muted-foreground">
          Update your ecosystem project page details. Publishing and visibility
          changes are handled by Arcademy staff.
        </p>
      )}
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Arcium"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A plain-language explanation of what this ecosystem project does."
          required
          rows={5}
        />
      </div>

      <CloudinaryUpload
        label="Ecosystem project logo"
        value={logoUrl}
        onChange={setLogoUrl}
        productId={variant === "partner" ? partnerProductId : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Privacy Infrastructure"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="partnerName">Partner name</Label>
          <Input
            id="partnerName"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Arcium"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Ecosystem project links</Label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
              <Input
                value={link.label}
                onChange={(e) =>
                  setLinks((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, label: e.target.value } : item
                    )
                  )
                }
                placeholder="Docs"
              />
              <Input
                value={link.url}
                onChange={(e) =>
                  setLinks((prev) =>
                    prev.map((item, idx) =>
                      idx === i ? { ...item, url: e.target.value } : item
                    )
                  )
                }
                placeholder="https://docs.example.com"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setLinks((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
        >
          <Plus />
          Add link
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          {variant === "partner"
            ? "Save project settings"
            : isEdit
              ? "Save changes"
              : "Create ecosystem project"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" />
            Saved
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
