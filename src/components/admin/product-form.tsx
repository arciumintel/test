"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUpload } from "@/components/cloudinary-upload";
import { ProductCategoryField } from "@/components/admin/product-category-field";
import {
  FormActions,
  FormSaveStatus,
  FormSubmitButton,
} from "@/components/ui/form-actions";
import {
  FormField,
  FormFieldGroup,
  FormHelperText,
  FormLabel,
} from "@/components/ui/form-field";
import { FormLayout } from "@/components/ui/form-layout";
import { FormSection } from "@/components/ui/form-section";
import { Select } from "@/components/ui/select";
import { createProduct, updateProduct } from "@/app/actions/admin-products";
import { updatePartnerProduct } from "@/app/actions/partner-products";
import { FIELD_LIMITS as L } from "@/lib/field-limits";

type ProductLink = {
  label: string;
  url: string;
};

type Initial = {
  id?: string;
  name: string;
  description: string;
  logoUrl: string | null;
  bannerUrl?: string | null;
  category: string | null;
  partnerName: string | null;
  links: ProductLink[];
  learningOutcomes?: string[];
  featured?: boolean;
  featuredOrder?: number | null;
  role?: "foundation" | "ecosystem";
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
  const [bannerUrl, setBannerUrl] = React.useState(initial?.bannerUrl ?? "");
  const [category, setCategory] = React.useState(initial?.category ?? "");
  const [partnerName, setPartnerName] = React.useState(initial?.partnerName ?? "");
  const [learningOutcomes, setLearningOutcomes] = React.useState<string[]>(
    initial?.learningOutcomes?.length ? initial.learningOutcomes : [""]
  );
  const [featured, setFeatured] = React.useState(initial?.featured ?? false);
  const [featuredOrder, setFeaturedOrder] = React.useState(
    initial?.featuredOrder != null ? String(initial.featuredOrder) : ""
  );
  const [role, setRole] = React.useState<"foundation" | "ecosystem">(
    initial?.role ?? "ecosystem"
  );
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
      bannerUrl: bannerUrl || null,
      category: role === "foundation" ? null : category || null,
      partnerName: partnerName || null,
      links: links.filter((link) => link.label.trim() && link.url.trim()),
      ...(variant === "admin"
        ? {
            role,
            learningOutcomes: learningOutcomes
              .map((outcome) => outcome.trim())
              .filter(Boolean),
            featured: role === "foundation" ? false : featured,
            featuredOrder:
              role === "foundation" || !featured
                ? null
                : featuredOrder.trim()
                  ? Number.parseInt(featuredOrder, 10)
                  : null,
          }
        : {}),
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
    <FormLayout onSubmit={handleSubmit}>
      {variant === "partner" && (
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Update your project page details. Publishing and visibility changes
          are handled by Arcademy staff.
        </p>
      )}

      <FormSection
        title="General information"
        description="How this project appears in the Arcademy catalog."
      >
        <FormFieldGroup>
          <FormField>
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Official project name as it should appear on Arcademy"
              maxLength={L.productName}
              required
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="description">Description</FormLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what this project does and who it is for"
              maxLength={L.productDescription}
              required
              rows={5}
            />
          </FormField>
        </FormFieldGroup>
      </FormSection>

      <FormSection title="Branding">
        <FormFieldGroup>
          <CloudinaryUpload
            label="Project logo"
            value={logoUrl}
            onChange={setLogoUrl}
            productId={variant === "partner" ? partnerProductId : undefined}
          />
          {variant === "admin" ? (
            <CloudinaryUpload
              label="Banner image"
              value={bannerUrl}
              onChange={setBannerUrl}
              productId={initial?.id}
            />
          ) : null}
        </FormFieldGroup>
      </FormSection>

      {variant === "admin" ? (
        <FormSection
          title="Catalog presentation"
          description="Optional fields for the public projects list."
        >
          <FormFieldGroup>
            <FormField>
              <FormLabel htmlFor="productRole">Product role</FormLabel>
              <Select
                id="productRole"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "foundation" | "ecosystem")
                }
              >
                <option value="ecosystem">Ecosystem project</option>
                <option value="foundation">Foundation (core learning)</option>
              </Select>
              <FormHelperText>
                Foundation products are pinned for onboarding (e.g. Arcium).
                Ecosystem projects appear in the project grid and can be
                featured.
              </FormHelperText>
            </FormField>
            {role === "ecosystem" ? (
              <FormField>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  Featured project
                </label>
                <FormHelperText>
                  Featured projects appear in a highlighted section on the projects
                  page.
                </FormHelperText>
              </FormField>
            ) : null}
            {role === "ecosystem" && featured ? (
              <FormField>
                <FormLabel htmlFor="featuredOrder">Featured order</FormLabel>
                <Input
                  id="featuredOrder"
                  type="number"
                  min={0}
                  max={999}
                  value={featuredOrder}
                  onChange={(event) => setFeaturedOrder(event.target.value)}
                  placeholder="0"
                />
                <FormHelperText>Lower numbers appear first.</FormHelperText>
              </FormField>
            ) : null}
            <FormField>
              <FormLabel>Learning outcomes</FormLabel>
              <div className="space-y-2">
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={outcome}
                      onChange={(event) =>
                        setLearningOutcomes((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? event.target.value : item
                          )
                        )
                      }
                      placeholder="What learners will gain from this project"
                      maxLength={L.learningOutcome}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setLearningOutcomes((prev) =>
                          prev.filter((_, idx) => idx !== index)
                        )
                      }
                      aria-label={`Remove outcome ${index + 1}`}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              {learningOutcomes.length < 8 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-fit"
                  onClick={() =>
                    setLearningOutcomes((prev) => [...prev, ""])
                  }
                >
                  <Plus />
                  Add outcome
                </Button>
              ) : null}
            </FormField>
          </FormFieldGroup>
        </FormSection>
      ) : null}

      <FormSection title="Metadata">
        <div className="grid gap-6 sm:grid-cols-2">
          {role === "ecosystem" || variant === "partner" ? (
            <ProductCategoryField value={category} onChange={setCategory} />
          ) : (
            <FormField>
              <FormLabel>Category</FormLabel>
              <FormHelperText>
                Foundation products don&apos;t use vertical categories. Learners
                discover them through Start and learning paths.
              </FormHelperText>
            </FormField>
          )}
          <FormField>
            <FormLabel htmlFor="partnerName">Partner name</FormLabel>
            <Input
              id="partnerName"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Team or organization behind this project"
              maxLength={L.partnerName}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Project links"
        description="Docs, websites, and other resources learners may need."
      >
        <FormField>
          <div className="space-y-3">
            {links.map((link, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[160px_1fr_auto]">
                <Input
                  value={link.label}
                  onChange={(e) =>
                    setLinks((prev) =>
                      prev.map((item, idx) =>
                        idx === i ? { ...item, label: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Link label"
                  maxLength={L.linkLabel}
                  className="min-w-0"
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
                  maxLength={L.linkUrl}
                  className="min-w-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setLinks((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  aria-label={`Remove link ${i + 1}`}
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
            className="mt-4 w-fit"
            onClick={() => setLinks((prev) => [...prev, { label: "", url: "" }])}
          >
            <Plus />
            Add link
          </Button>
        </FormField>
      </FormSection>

      <FormActions sticky>
        <FormSubmitButton busy={busy}>
          <Save />
          {variant === "partner"
            ? "Save project settings"
            : isEdit
              ? "Save changes"
              : "Create project"}
        </FormSubmitButton>
        <FormSaveStatus saved={saved} error={error} />
      </FormActions>
    </FormLayout>
  );
}
