import { partnerDocs } from "collections/server";
import { loader } from "fumadocs-core/source";

export const partnerDocsSource = loader({
  baseUrl: "/partners/docs",
  source: partnerDocs.toFumadocsSource(),
});
