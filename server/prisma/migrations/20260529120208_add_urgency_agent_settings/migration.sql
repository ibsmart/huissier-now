-- AlterTable
ALTER TABLE "HuissierAgent" ADD COLUMN     "acceptsExpress" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsScheduled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsTomorrow" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Intervention" ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "surcharge" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "urgency" TEXT NOT NULL DEFAULT 'express';
