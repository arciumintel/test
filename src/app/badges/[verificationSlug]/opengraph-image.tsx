import { ImageResponse } from "next/og";
import { getBadgeAwardByVerificationSlug } from "@/lib/badges";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const VAULT = {
  canvas: "#0c1a1c",
  card: "#102325",
  foreground: "#eaf3f1",
  muted: "#8ba6a2",
  primary: "#2fa6a0",
  seal: "#d6a43b",
} as const;

export default async function Image({
  params,
}: {
  params: Promise<{ verificationSlug: string }>;
}) {
  const { verificationSlug } = await params;
  const award = await getBadgeAwardByVerificationSlug(verificationSlug);

  if (!award) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: VAULT.canvas,
            color: VAULT.foreground,
            fontSize: 48,
            fontWeight: 600,
          }}
        >
          Badge not found
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: VAULT.canvas,
          color: VAULT.foreground,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              border: `2px solid ${VAULT.seal}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: VAULT.seal,
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Arcademy</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: VAULT.primary,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Verified completion
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {award.badge.name}
          </div>
          <div
            style={{ fontSize: 30, color: VAULT.muted, lineHeight: 1.4 }}
          >
            {award.course.title} · {award.course.product.name}
          </div>
        </div>

        <div style={{ fontSize: 22, color: VAULT.muted }}>
          Official Arcium ecosystem learning credential
        </div>
      </div>
    ),
    { ...size }
  );
}
