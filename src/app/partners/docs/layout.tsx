import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { partnerDocsSource } from "@/lib/partner-docs-source";
import { partnerDocsBaseOptions } from "@/lib/partner-docs-layout.shared";

export default function PartnerDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsLayout
      tree={partnerDocsSource.pageTree}
      {...partnerDocsBaseOptions()}
    >
      {children}
    </DocsLayout>
  );
}
