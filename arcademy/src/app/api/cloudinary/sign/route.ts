import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { signUpload, cloudinaryConfigured } from "@/lib/cloudinary";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "staff_admin") {
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
