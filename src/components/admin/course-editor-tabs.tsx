"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourseDetailsForm } from "@/components/admin/course-details-form";
import { LessonsManager, type AdminLesson } from "@/components/admin/lessons-manager";
import { QuizManager, type AdminQuiz } from "@/components/admin/quiz-manager";
import { BadgeForm } from "@/components/admin/badge-form";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import type { CourseAnalytics } from "@/lib/analytics";
import type { CourseLevel, CourseType, BadgeStatus, CourseStatus } from "@prisma/client";
import { PARTNER_EDITABLE_STATUSES } from "@/lib/course-schemas";

type CourseInitial = {
  id: string;
  title: string;
  productId: string;
  summary: string;
  description: string | null;
  level: CourseLevel;
  courseType: CourseType;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  learningOutcomes: string[];
  prerequisiteCourseIds: string[];
};

type ProductOption = {
  id: string;
  name: string;
  status: string;
};

type BadgeInitial = {
  name: string;
  description: string;
  imageUrl: string | null;
  criteria: string | null;
  issuer: string | null;
  status: BadgeStatus;
} | null;

type PrerequisiteOption = {
  id: string;
  title: string;
};

export function CourseEditorTabs({
  course,
  lessons,
  quiz,
  badge,
  analytics,
  products,
  prerequisiteOptions = [],
  variant = "admin",
  partnerProductId,
  courseStatus,
}: {
  course: CourseInitial;
  lessons: AdminLesson[];
  quiz: AdminQuiz;
  badge: BadgeInitial;
  analytics: CourseAnalytics;
  products: ProductOption[];
  prerequisiteOptions?: PrerequisiteOption[];
  variant?: "admin" | "partner";
  partnerProductId?: string;
  courseStatus?: CourseStatus;
}) {
  const readOnly =
    variant === "partner" &&
    courseStatus !== undefined &&
    !PARTNER_EDITABLE_STATUSES.includes(
      courseStatus as (typeof PARTNER_EDITABLE_STATUSES)[number]
    );

  return (
    <Tabs defaultValue="details" className="mt-6">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
        <TabsTrigger value="badge">Badge</TabsTrigger>
        {variant === "admin" && (
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="details" className="max-w-3xl">
        <CourseDetailsForm
          initial={course}
          products={products}
          prerequisiteOptions={prerequisiteOptions}
          variant={variant}
          partnerProductId={partnerProductId}
          coursePathPrefix={
            variant === "partner" && partnerProductId
              ? `/partner-console/${partnerProductId}/courses`
              : undefined
          }
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="lessons">
        <LessonsManager
          courseId={course.id}
          lessons={lessons}
          variant={variant}
          partnerProductId={partnerProductId}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="quiz">
        <QuizManager
          courseId={course.id}
          quiz={quiz}
          variant={variant}
          partnerProductId={partnerProductId}
          readOnly={readOnly}
        />
      </TabsContent>

      <TabsContent value="badge" className="max-w-2xl">
        <BadgeForm
          courseId={course.id}
          initial={badge}
          variant={variant}
          partnerProductId={partnerProductId}
          readOnly={readOnly}
        />
      </TabsContent>

      {variant === "admin" && (
        <TabsContent value="analytics">
          <AnalyticsPanel data={analytics} />
        </TabsContent>
      )}
    </Tabs>
  );
}
