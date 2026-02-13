/*
  Warnings:

  - You are about to drop the column `clockInLat` on the `Pointage` table. All the data in the column will be lost.
  - You are about to drop the column `clockInLng` on the `Pointage` table. All the data in the column will be lost.
  - You are about to drop the column `clockOutLat` on the `Pointage` table. All the data in the column will be lost.
  - You are about to drop the column `clockOutLng` on the `Pointage` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginLat` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginLng` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `GPSTracking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Geofence` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AvanceStatut" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CHEF';

-- DropForeignKey
ALTER TABLE "GPSTracking" DROP CONSTRAINT "GPSTracking_employeId_fkey";

-- AlterTable
ALTER TABLE "Pointage" DROP COLUMN "clockInLat",
DROP COLUMN "clockInLng",
DROP COLUMN "clockOutLat",
DROP COLUMN "clockOutLng";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastLoginLat",
DROP COLUMN "lastLoginLng";

-- DropTable
DROP TABLE "GPSTracking";

-- DropTable
DROP TABLE "Geofence";

-- CreateTable
CREATE TABLE "Avance" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "statut" "AvanceStatut" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Avance_employeId_idx" ON "Avance"("employeId");

-- CreateIndex
CREATE INDEX "Avance_date_idx" ON "Avance"("date");

-- AddForeignKey
ALTER TABLE "Avance" ADD CONSTRAINT "Avance_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
