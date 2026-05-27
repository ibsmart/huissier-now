/*
  Warnings:

  - You are about to drop the column `huissierId` on the `Intervention` table. All the data in the column will be lost.
  - You are about to drop the column `huissierLat` on the `InterventionLog` table. All the data in the column will be lost.
  - You are about to drop the column `huissierLng` on the `InterventionLog` table. All the data in the column will be lost.
  - You are about to drop the `Huissier` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'agent';

-- DropForeignKey
ALTER TABLE "Huissier" DROP CONSTRAINT "Huissier_id_fkey";

-- DropForeignKey
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_huissierId_fkey";

-- AlterTable
ALTER TABLE "Intervention" DROP COLUMN "huissierId",
ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "firmId" TEXT;

-- AlterTable
ALTER TABLE "InterventionLog" DROP COLUMN "huissierLat",
DROP COLUMN "huissierLng",
ADD COLUMN     "agentLat" DOUBLE PRECISION,
ADD COLUMN     "agentLng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firmId" TEXT;

-- DropTable
DROP TABLE "Huissier";

-- CreateTable
CREATE TABLE "HuissierFirm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HuissierFirm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuissierAgent" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "radiusKm" INTEGER NOT NULL DEFAULT 20,
    "rating" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuissierAgent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "HuissierFirm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuissierAgent" ADD CONSTRAINT "HuissierAgent_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuissierAgent" ADD CONSTRAINT "HuissierAgent_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "HuissierFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "HuissierFirm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "HuissierAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
