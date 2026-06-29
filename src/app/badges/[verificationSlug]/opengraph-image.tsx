import { ImageResponse } from "next/og";
import { getBadgeAwardByVerificationSlug } from "@/lib/badges";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
            background: "#0f172a",
            color: "#f8fafc",
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f766e 100%)",
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
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
              color: "#5eead4",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Verified completion
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            {award.badge.name}
          </div>
          <div style={{ fontSize: 30, color: "#cbd5e1", lineHeight: 1.4 }}>
            {award.course.title} · {award.course.product.name}
          </div>
        </div>

        <div style={{ fontSize: 22, color: "#94a3b8" }}>
          Official Arcium ecosystem learning credential
        </div>
      </div>
    ),
    { ...size }
  );
}
