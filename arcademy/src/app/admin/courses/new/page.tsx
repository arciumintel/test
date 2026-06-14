import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CourseDetailsForm } from "@/components/admin/course-details-form";

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Dashboard
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">New course</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Start with the basics. You can add lessons, a quiz, and a badge after
        creating the course.
      </p>
      <div className="mt-8">
        <CourseDetailsForm />
      </div>
    </div>
  );
}
