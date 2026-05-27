-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('client', 'huissier', 'admin');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('constat', 'signification', 'saisie', 'autre');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('pending', 'accepted', 'en_route', 'arrived', 'done', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Huissier" (
    "id" TEXT NOT NULL,
    "studyName" TEXT NOT NULL,
    "siret" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "radiusKm" INTEGER NOT NULL DEFAULT 20,
    "rating" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Huissier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "huissierId" TEXT,
    "type" "InterventionType" NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" "InterventionStatus" NOT NULL DEFAULT 'pending',
    "clientLat" DOUBLE PRECISION NOT NULL,
    "clientLng" DOUBLE PRECISION NOT NULL,
    "clientAddress" TEXT NOT NULL,
    "etaMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionLog" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "huissierLat" DOUBLE PRECISION,
    "huissierLng" DOUBLE PRECISION,
    "etaMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,
    "fromClientId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Huissier" ADD CONSTRAINT "Huissier_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_huissierId_fkey" FOREIGN KEY ("huissierId") REFERENCES "Huissier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionLog" ADD CONSTRAINT "InterventionLog_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionLog" ADD CONSTRAINT "InterventionLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_fromClientId_fkey" FOREIGN KEY ("fromClientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
