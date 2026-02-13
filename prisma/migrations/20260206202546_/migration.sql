-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYE');

-- CreateEnum
CREATE TYPE "StatutEmploye" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "StatutPointage" AS ENUM ('PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'FERIE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employe" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "photo" TEXT,
    "poste" TEXT NOT NULL,
    "dateEmbauche" TIMESTAMP(3) NOT NULL,
    "salaireBase" DOUBLE PRECISION NOT NULL,
    "statut" "StatutEmploye" NOT NULL DEFAULT 'ACTIF',
    "soldeConges" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "soldeMaladie" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pointage" (
    "id" TEXT NOT NULL,
    "employeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "statut" "StatutPointage" NOT NULL,
    "heuresSupp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joursTravailles" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employe_userId_key" ON "Employe"("userId");

-- CreateIndex
CREATE INDEX "Employe_statut_idx" ON "Employe"("statut");

-- CreateIndex
CREATE INDEX "Employe_nom_prenom_idx" ON "Employe"("nom", "prenom");

-- CreateIndex
CREATE INDEX "Pointage_employeId_idx" ON "Pointage"("employeId");

-- CreateIndex
CREATE INDEX "Pointage_date_idx" ON "Pointage"("date");

-- CreateIndex
CREATE INDEX "Pointage_statut_idx" ON "Pointage"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Pointage_employeId_date_key" ON "Pointage"("employeId", "date");

-- AddForeignKey
ALTER TABLE "Employe" ADD CONSTRAINT "Employe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "Employe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
