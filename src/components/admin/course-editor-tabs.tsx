"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CourseDetailsForm } from "@/components/admin/course-details-form";
import { LessonsManager, type AdminLesson } from "@/components/admin/lessons-manager";
import { QuizManager, type AdminQuiz } from "@/components/admin/quiz-manager";
import { BadgeForm } from "@/components/admin/badge-form";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import type { CourseAnalytics } from "@/lib/analytics";
import type { CourseLevel, CourseType, BadgeStatus } from "@prisma/client";

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
}: {
  course: CourseInitial;
  lessons: AdminLesson[];
  quiz: AdminQuiz;
  badge: BadgeInitial;
  analytics: CourseAnalytics;
  products: ProductOption[];
  prerequisiteOptions?: PrerequisiteOption[];
}) {
  return (
    <Tabs defaultValue="details" className="mt-6">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
        <TabsTrigger value="badge">Badge</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="max-w-3xl">
        <CourseDetailsForm
          initial={course}
          products={products}
          prerequisiteOptions={prerequisiteOptions}
        />
      </TabsContent>

      <TabsContent value="lessons">
        <LessonsManager courseId={course.id} lessons={lessons} />
      </TabsContent>

      <TabsContent value="quiz">
        <QuizManager courseId={course.id} quiz={quiz} />
      </TabsContent>

      <TabsContent value="badge" className="max-w-2xl">
        <BadgeForm courseId={course.id} initial={badge} />
      </TabsContent>

      <TabsContent value="analytics">
        <AnalyticsPanel data={analytics} />
      </TabsContent>
    </Tabs>
  );
}
