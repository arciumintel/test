import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isProjectAdmin } from "@/lib/project-admin";
import { signUpload, cloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let productId: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.productId === "string") {
      productId = body.productId;
    }
  } catch {
    productId = null;
  }

  const isStaff = user.role === "staff_admin";
  const isPartner =
    productId !== null && (await isProjectAdmin(user.id, productId));

  if (!isStaff && !isPartner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!cloudinaryConfigured) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Set credentials in .env." },
      { status: 503 }
    );
  }
  return NextResponse.json(signUpload({}));
}
