-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SummaryChannel" AS ENUM ('MANUAL', 'WHATSAPP', 'EMAIL');

-- AlterTable
ALTER TABLE "TimelineEntry"
  ADD COLUMN "recordedAt"   TIMESTAMP(3),
  ADD COLUMN "contextLabel" TEXT,
  ADD COLUMN "contextNote"  TEXT,
  ADD COLUMN "aiTitle"      TEXT,
  ADD COLUMN "aiSummary"    TEXT,
  ADD COLUMN "aiStatus"     "AiStatus" NOT NULL DEFAULT 'NOT_REQUESTED';

-- CreateTable
CREATE TABLE "DailySummarySettings" (
  "id"             TEXT NOT NULL,
  "psychologistId" TEXT NOT NULL,
  "channel"        "SummaryChannel" NOT NULL DEFAULT 'MANUAL',
  "sendTime"       TEXT NOT NULL DEFAULT '08:00',
  "timezone"       TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  "enabled"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DailySummarySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailySummarySettings_psychologistId_key" ON "DailySummarySettings"("psychologistId");

-- AddForeignKey
ALTER TABLE "DailySummarySettings"
  ADD CONSTRAINT "DailySummarySettings_psychologistId_fkey"
  FOREIGN KEY ("psychologistId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
