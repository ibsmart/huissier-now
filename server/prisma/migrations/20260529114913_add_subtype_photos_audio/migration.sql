/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `Intervention` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Intervention" DROP COLUMN "photoUrl",
ADD COLUMN     "audioBase64" TEXT,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "subType" TEXT;
