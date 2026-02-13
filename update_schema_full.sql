-- ==========================================
-- SCRIPT DE MISE À JOUR DE LA BASE DE DONNÉES
-- ==========================================

-- 1. CRÉATION DE LA TABLE GEOFENCE
CREATE TABLE IF NOT EXISTS "Geofence" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Geofence_pkey" PRIMARY KEY ("id")
);

-- 2. CRÉATION DE LA TABLE GPSTRACKING
CREATE TABLE IF NOT EXISTS "GPSTracking" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSTracking_pkey" PRIMARY KEY ("id")
);

-- 3. AJOUT DES COLONNES À LA TABLE USER
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginLat" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginLng" DOUBLE PRECISION;

-- 4. AJOUT DES COLONNES À LA TABLE EMPLOYE
ALTER TABLE "Employe" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "Employe" ADD COLUMN IF NOT EXISTS "departement" TEXT;
ALTER TABLE "Employe" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

-- Créer un index unique sur employeeId s'il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'Employe_employeeId_key' AND n.nspname = 'public') THEN
        CREATE UNIQUE INDEX "Employe_employeeId_key" ON "Employe"("employeeId");
    END IF;
END $$;

-- 5. AJOUT DES COLONNES À LA TABLE POINTAGE
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockInTime" TIMESTAMP(3);
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockInLat" DOUBLE PRECISION;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockInLng" DOUBLE PRECISION;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockOutTime" TIMESTAMP(3);
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockOutLat" DOUBLE PRECISION;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "clockOutLng" DOUBLE PRECISION;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "totalHours" DOUBLE PRECISION;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "isAutoClockIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pointage" ADD COLUMN IF NOT EXISTS "isAutoClockOut" BOOLEAN NOT NULL DEFAULT false;

-- 6. AJOUT DES CLÉS ÉTRANGÈRES
-- GPSTracking -> Employe via contrainte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'GPSTracking_employeId_fkey'
    ) THEN
        ALTER TABLE "GPSTracking" 
        ADD CONSTRAINT "GPSTracking_employeId_fkey" 
        FOREIGN KEY ("employeId") 
        REFERENCES "Employe"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 7. INSERTION DU PÉRIMÈTRE DE TEST (Polyclinique Arij Djerba)
INSERT INTO "Geofence" (
    "id", 
    "nom", 
    "description", 
    "centerLat", 
    "centerLng", 
    "radiusMeters", 
    "isActive", 
    "createdAt", 
    "updatedAt"
)
VALUES (
    gen_random_uuid(),
    'TEST - Polyclinique Arij Djerba',
    'Périmètre de test - Avenue de l''environnement, Midoun',
    33.87743,
    10.87768,
    200,
    true,
    NOW(),
    NOW()
);

-- 8. VÉRIFICATION
SELECT * FROM "Geofence";
