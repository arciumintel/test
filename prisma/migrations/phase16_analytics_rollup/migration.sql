-- CreateTable
CREATE TABLE "AnalyticsDailyRollup" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eventName" TEXT NOT NULL,
    "ecosystemProjectId" TEXT,
    "courseId" TEXT,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "uniqueAnonymous" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsDailyRollup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsDailyRollup_date_idx" ON "AnalyticsDailyRollup"("date");

-- CreateIndex
CREATE INDEX "AnalyticsDailyRollup_eventName_date_idx" ON "AnalyticsDailyRollup"("eventName", "date");

-- CreateIndex
CREATE INDEX "AnalyticsDailyRollup_ecosystemProjectId_eventName_date_idx" ON "AnalyticsDailyRollup"("ecosystemProjectId", "eventName", "date");
