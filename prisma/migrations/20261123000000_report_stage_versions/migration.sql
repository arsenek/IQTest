-- AlterTable
ALTER TABLE "Report" ADD COLUMN "scoringStage" TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE "Report" ADD COLUMN "normVersion" TEXT NOT NULL DEFAULT 'placeholder/v1';
ALTER TABLE "Report" ADD COLUMN "algorithmVersion" TEXT NOT NULL DEFAULT 'scale-z/v1';
