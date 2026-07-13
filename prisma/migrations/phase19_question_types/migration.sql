-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM (
  'single_select',
  'true_false',
  'image_select',
  'scenario_select',
  'multi_select',
  'ordering',
  'matching',
  'fill_blank'
);

-- AlterTable
ALTER TABLE "Question"
  ADD COLUMN "type" "QuestionType" NOT NULL DEFAULT 'single_select',
  ADD COLUMN "mediaUrl" TEXT,
  ADD COLUMN "leftItems" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "correctAnswers" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "correctOrder" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "correctMatches" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN "acceptableAnswers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve existing rows: correctAnswer already populated.
ALTER TABLE "Question" ALTER COLUMN "correctAnswer" SET DEFAULT 0;
