-- Phase 20: Analytics Profile foundation + ProjectAdmin analyst role

-- Extend ProjectAdminRole with analyst (existing owner/manager unchanged)
ALTER TYPE "ProjectAdminRole" ADD VALUE IF NOT EXISTS 'analyst';

-- AnalyticsProfile
CREATE TABLE IF NOT EXISTS "AnalyticsProfile" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "schemaVersion" INTEGER NOT NULL DEFAULT 1,
  "terminology" JSONB NOT NULL DEFAULT '{}',
  "kpiSet" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "funnelStages" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sectionVisibility" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "recommendationPolicy" JSONB NOT NULL DEFAULT '{}',
  "enabledProviderIds" TEXT[] DEFAULT ARRAY['core']::TEXT[],
  "featureFlags" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsProfile_productId_key" ON "AnalyticsProfile"("productId");

ALTER TABLE "AnalyticsProfile"
  DROP CONSTRAINT IF EXISTS "AnalyticsProfile_productId_fkey";
ALTER TABLE "AnalyticsProfile"
  ADD CONSTRAINT "AnalyticsProfile_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AnalyticsPackInstall
CREATE TABLE IF NOT EXISTS "AnalyticsPackInstall" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "packId" TEXT NOT NULL,
  "packVersion" TEXT NOT NULL,
  "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsPackInstall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsPackInstall_productId_packId_key"
  ON "AnalyticsPackInstall"("productId", "packId");
CREATE INDEX IF NOT EXISTS "AnalyticsPackInstall_productId_idx"
  ON "AnalyticsPackInstall"("productId");

ALTER TABLE "AnalyticsPackInstall"
  DROP CONSTRAINT IF EXISTS "AnalyticsPackInstall_productId_fkey";
ALTER TABLE "AnalyticsPackInstall"
  ADD CONSTRAINT "AnalyticsPackInstall_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillCategory
CREATE TABLE IF NOT EXISTS "SkillCategory" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SkillCategory_productId_slug_key" ON "SkillCategory"("productId", "slug");
CREATE INDEX IF NOT EXISTS "SkillCategory_productId_idx" ON "SkillCategory"("productId");

ALTER TABLE "SkillCategory"
  DROP CONSTRAINT IF EXISTS "SkillCategory_productId_fkey";
ALTER TABLE "SkillCategory"
  ADD CONSTRAINT "SkillCategory_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ConceptImportance / ConceptRelationType enums
DO $$ BEGIN
  CREATE TYPE "ConceptImportance" AS ENUM ('critical', 'core', 'supporting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ConceptRelationType" AS ENUM ('prerequisite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Concept
CREATE TABLE IF NOT EXISTS "Concept" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "skillCategoryId" TEXT,
  "importance" "ConceptImportance" NOT NULL DEFAULT 'core',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Concept_productId_slug_key" ON "Concept"("productId", "slug");
CREATE INDEX IF NOT EXISTS "Concept_productId_idx" ON "Concept"("productId");
CREATE INDEX IF NOT EXISTS "Concept_skillCategoryId_idx" ON "Concept"("skillCategoryId");

ALTER TABLE "Concept"
  DROP CONSTRAINT IF EXISTS "Concept_productId_fkey";
ALTER TABLE "Concept"
  ADD CONSTRAINT "Concept_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Concept"
  DROP CONSTRAINT IF EXISTS "Concept_skillCategoryId_fkey";
ALTER TABLE "Concept"
  ADD CONSTRAINT "Concept_skillCategoryId_fkey"
  FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ConceptRelation
CREATE TABLE IF NOT EXISTS "ConceptRelation" (
  "id" TEXT NOT NULL,
  "fromConceptId" TEXT NOT NULL,
  "toConceptId" TEXT NOT NULL,
  "type" "ConceptRelationType" NOT NULL DEFAULT 'prerequisite',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConceptRelation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConceptRelation_fromConceptId_toConceptId_type_key"
  ON "ConceptRelation"("fromConceptId", "toConceptId", "type");
CREATE INDEX IF NOT EXISTS "ConceptRelation_toConceptId_idx" ON "ConceptRelation"("toConceptId");

ALTER TABLE "ConceptRelation"
  DROP CONSTRAINT IF EXISTS "ConceptRelation_fromConceptId_fkey";
ALTER TABLE "ConceptRelation"
  ADD CONSTRAINT "ConceptRelation_fromConceptId_fkey"
  FOREIGN KEY ("fromConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConceptRelation"
  DROP CONSTRAINT IF EXISTS "ConceptRelation_toConceptId_fkey";
ALTER TABLE "ConceptRelation"
  ADD CONSTRAINT "ConceptRelation_toConceptId_fkey"
  FOREIGN KEY ("toConceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LearningObjective
CREATE TABLE IF NOT EXISTS "LearningObjective" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningObjective_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningObjective_productId_slug_key"
  ON "LearningObjective"("productId", "slug");
CREATE INDEX IF NOT EXISTS "LearningObjective_productId_idx" ON "LearningObjective"("productId");

ALTER TABLE "LearningObjective"
  DROP CONSTRAINT IF EXISTS "LearningObjective_productId_fkey";
ALTER TABLE "LearningObjective"
  ADD CONSTRAINT "LearningObjective_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "LearningObjectiveConcept" (
  "id" TEXT NOT NULL,
  "learningObjectiveId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "LearningObjectiveConcept_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningObjectiveConcept_learningObjectiveId_conceptId_key"
  ON "LearningObjectiveConcept"("learningObjectiveId", "conceptId");
CREATE INDEX IF NOT EXISTS "LearningObjectiveConcept_conceptId_idx"
  ON "LearningObjectiveConcept"("conceptId");

ALTER TABLE "LearningObjectiveConcept"
  DROP CONSTRAINT IF EXISTS "LearningObjectiveConcept_learningObjectiveId_fkey";
ALTER TABLE "LearningObjectiveConcept"
  ADD CONSTRAINT "LearningObjectiveConcept_learningObjectiveId_fkey"
  FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningObjectiveConcept"
  DROP CONSTRAINT IF EXISTS "LearningObjectiveConcept_conceptId_fkey";
ALTER TABLE "LearningObjectiveConcept"
  ADD CONSTRAINT "LearningObjectiveConcept_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ContentConceptTag
CREATE TABLE IF NOT EXISTS "ContentConceptTag" (
  "id" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "lessonId" TEXT,
  "questionId" TEXT,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "difficulty" INTEGER,
  "importance" "ConceptImportance",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentConceptTag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentConceptTag_conceptId_idx" ON "ContentConceptTag"("conceptId");
CREATE INDEX IF NOT EXISTS "ContentConceptTag_lessonId_idx" ON "ContentConceptTag"("lessonId");
CREATE INDEX IF NOT EXISTS "ContentConceptTag_questionId_idx" ON "ContentConceptTag"("questionId");

ALTER TABLE "ContentConceptTag"
  DROP CONSTRAINT IF EXISTS "ContentConceptTag_conceptId_fkey";
ALTER TABLE "ContentConceptTag"
  ADD CONSTRAINT "ContentConceptTag_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentConceptTag"
  DROP CONSTRAINT IF EXISTS "ContentConceptTag_lessonId_fkey";
ALTER TABLE "ContentConceptTag"
  ADD CONSTRAINT "ContentConceptTag_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentConceptTag"
  DROP CONSTRAINT IF EXISTS "ContentConceptTag_questionId_fkey";
ALTER TABLE "ContentConceptTag"
  ADD CONSTRAINT "ContentConceptTag_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ConversionDefinition
CREATE TABLE IF NOT EXISTS "ConversionDefinition" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversionDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ConversionDefinition_productId_key_key"
  ON "ConversionDefinition"("productId", "key");
CREATE INDEX IF NOT EXISTS "ConversionDefinition_productId_idx"
  ON "ConversionDefinition"("productId");

ALTER TABLE "ConversionDefinition"
  DROP CONSTRAINT IF EXISTS "ConversionDefinition_productId_fkey";
ALTER TABLE "ConversionDefinition"
  ADD CONSTRAINT "ConversionDefinition_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ReadinessModel
CREATE TABLE IF NOT EXISTS "ReadinessModel" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "requirements" JSONB NOT NULL DEFAULT '[]',
  "levels" JSONB NOT NULL DEFAULT '[]',
  "readyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessModel_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReadinessModel_productId_idx" ON "ReadinessModel"("productId");

ALTER TABLE "ReadinessModel"
  DROP CONSTRAINT IF EXISTS "ReadinessModel_productId_fkey";
ALTER TABLE "ReadinessModel"
  ADD CONSTRAINT "ReadinessModel_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
