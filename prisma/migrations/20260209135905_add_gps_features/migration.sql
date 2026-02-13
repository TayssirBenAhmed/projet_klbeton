/*
  Warnings:

  - A unique constraint covering the columns `[employeeId]` on the table `Employe` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Employe" ADD COLUMN     "departement" TEXT,
ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "telephone" TEXT;

-- AlterTable
ALTER TABLE "Pointage" ADD COLUMN     "clockInLat" DOUBLE PRECISION,
ADD COLUMN     "clockInLng" DOUBLE PRECISION,
ADD COLUMN     "clockInTime" TIMESTAMP(3),
ADD COLUMN     "clockOutLat" DOUBLE PRECISION,
ADD COLUMN     "clockOutLng" DOUBLE PRECISION,
ADD COLUMN     "clockOutTime" TIMESTAMP(3),
ADD COLUMN     "isAutoClockIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAutoClockOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalHours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginLat" DOUBLE PRECISION,
ADD COLUMN     "lastLoginLng" DOUBLE PRECISION,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordResetExpires" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "Geofence" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSTracking" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Geofence_isActive_idx" ON "Geofence"("isActive");

-- CreateIndex
CREATE INDEX "GPSTracking_employeId_idx" ON "GPSTracking"("employeId");

-- CreateIndex
CREATE INDEX "GPSTracking_timestamp_idx" ON "GPSTracking"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_employeeId_key" ON "Employe"("employeeId");

-- CreateIndex
CREATE INDEX "Employe_employeeId_idx" ON "Employe"("employeeId");

-- AddForeignKey
ALTER TABLE "GPSTracking" ADD CONSTRAINT "GPSTracking_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
