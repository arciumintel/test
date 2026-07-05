-- Phase 15: Modules, learning paths, notifications, ecosystem directory
-- Idempotent — safe when objects already exist from prior db push.

-- Enums ------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "DirectoryNetworkStatus" AS ENUM ('mainnet', 'testnet', 'coming_soon');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LearningPathStatus" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "QuizType" ADD VALUE IF NOT EXISTS 'lesson_knowledge_check';

-- Module -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Module" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Module_courseId_order_key" ON "Module"("courseId", "order");
CREATE INDEX IF NOT EXISTS "Module_courseId_idx" ON "Module"("courseId");

DO $$ BEGIN
  ALTER TABLE "Module"
    ADD CONSTRAINT "Module_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lesson.moduleId --------------------------------------------------------

ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;
CREATE INDEX IF NOT EXISTS "Lesson_moduleId_idx" ON "Lesson"("moduleId");

DO $$ BEGIN
  ALTER TABLE "Lesson"
    ADD CONSTRAINT "Lesson_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LearningPath -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "LearningPath" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "status" "LearningPathStatus" NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningPath_productId_slug_key" ON "LearningPath"("productId", "slug");
CREATE INDEX IF NOT EXISTS "LearningPath_productId_idx" ON "LearningPath"("productId");

DO $$ BEGIN
  ALTER TABLE "LearningPath"
    ADD CONSTRAINT "LearningPath_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- LearningPathCourse -----------------------------------------------------

CREATE TABLE IF NOT EXISTS "LearningPathCourse" (
  "id" TEXT NOT NULL,
  "pathId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  CONSTRAINT "LearningPathCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningPathCourse_pathId_courseId_key" ON "LearningPathCourse"("pathId", "courseId");
CREATE UNIQUE INDEX IF NOT EXISTS "LearningPathCourse_pathId_order_key" ON "LearningPathCourse"("pathId", "order");
CREATE INDEX IF NOT EXISTS "LearningPathCourse_courseId_idx" ON "LearningPathCourse"("courseId");

DO $$ BEGIN
  ALTER TABLE "LearningPathCourse"
    ADD CONSTRAINT "LearningPathCourse_pathId_fkey"
    FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LearningPathCourse"
    ADD CONSTRAINT "LearningPathCourse_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification -----------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "actionUrl" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- EcosystemDirectoryEntry ------------------------------------------------

CREATE TABLE IF NOT EXISTS "EcosystemDirectoryEntry" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "productId" TEXT,
  "name" TEXT NOT NULL,
  "tagline" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL,
  "logoUrl" TEXT,
  "categoryId" TEXT NOT NULL,
  "networkStatus" "DirectoryNetworkStatus" NOT NULL DEFAULT 'mainnet',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "trending" BOOLEAN NOT NULL DEFAULT false,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "links" JSONB NOT NULL DEFAULT '{}',
  "relationships" JSONB NOT NULL DEFAULT '[]',
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EcosystemDirectoryEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EcosystemDirectoryEntry_slug_key" ON "EcosystemDirectoryEntry"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "EcosystemDirectoryEntry_productId_key" ON "EcosystemDirectoryEntry"("productId");
CREATE INDEX IF NOT EXISTS "EcosystemDirectoryEntry_categoryId_idx" ON "EcosystemDirectoryEntry"("categoryId");
CREATE INDEX IF NOT EXISTS "EcosystemDirectoryEntry_networkStatus_idx" ON "EcosystemDirectoryEntry"("networkStatus");

DO $$ BEGIN
  ALTER TABLE "EcosystemDirectoryEntry"
    ADD CONSTRAINT "EcosystemDirectoryEntry_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Quiz.lessonId unique ---------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "Quiz_lessonId_key" ON "Quiz"("lessonId");
