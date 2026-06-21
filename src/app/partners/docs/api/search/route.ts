import { partnerDocsSource } from "@/lib/partner-docs-source";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(partnerDocsSource);
