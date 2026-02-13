-- SCRIPT DE VÉRIFICATION DES EMPLOYÉS
-- Copiez et collez ce script dans pgAdmin pour vérifier les employés

-- 1. Vérifier la connexion à la bonne base de données
SELECT current_database();

-- 2. Compter tous les employés
SELECT COUNT(*) as "Nombre Total d'Employés" 
FROM public."Employe";

-- 3. Lister TOUS les employés avec leurs détails
SELECT 
    id,
    nom,
    prenom,
    poste,
    statut,
    "dateEmbauche",
    "salaireBase",
    "createdAt"
FROM public."Employe"
ORDER BY "createdAt" DESC;

-- 4. Rechercher spécifiquement "ELFIDHA" ou "MAHDII"
SELECT 
    id,
    nom,
    prenom,
    poste,
    statut,
    "createdAt"
FROM public."Employe"
WHERE 
    UPPER(nom) LIKE '%ELFIDHA%' 
    OR UPPER(prenom) LIKE '%MAHDII%'
    OR UPPER(nom) LIKE '%MAHDII%'
    OR UPPER(prenom) LIKE '%ELFIDHA%';

-- 5. Afficher les 10 derniers employés créés
SELECT 
    nom,
    prenom,
    poste,
    "createdAt" as "Date de Création"
FROM public."Employe"
ORDER BY "createdAt" DESC
LIMIT 10;
