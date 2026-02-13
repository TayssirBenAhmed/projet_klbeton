-- ==============================================================
-- ✅ CREATE FRESH TEST EMPLOYEE (ALI BEN AHMED)
-- ==============================================================
-- 📧 Email:    ali.benahmed@klbeton.tn
-- 🔑 Password: test
-- ==============================================================

-- 1. Clean up potential conflicts
DELETE FROM "Employe" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'ali.benahmed@klbeton.tn');
DELETE FROM "User" WHERE email = 'ali.benahmed@klbeton.tn';

-- 2. Create User account
-- Password hash for 'test' is: $2b$10$i4Tm5Y3ezSAnj0.3VOMk29M4
INSERT INTO "User" (
    id,
    email,
    password,
    role,
    "createdAt",
    "updatedAt",
    "mustChangePassword"
) VALUES (
    gen_random_uuid(),
    'ali.benahmed@klbeton.tn',
    '$2b$10$i4Tm5Y3ezSAnj0.3VOMk29M4', 
    'EMPLOYE',
    NOW(),
    NOW(),
    false
);

-- 3. Create Employe record
INSERT INTO "Employe" (
    id,
    "userId",
    nom,
    prenom,
    telephone,
    poste,
    "dateEmbauche",
    "salaireBase",
    statut,
    "soldeConges",
    "soldeMaladie",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM "User" WHERE email = 'ali.benahmed@klbeton.tn'),
    'Ben Ahmed',
    'Ali',
    '+216 50 123 456',
    'Chauffeur',
    NOW(),
    1800.00,
    'ACTIF',
    18.0,
    10.0,
    NOW(),
    NOW()
);

-- 4. Verification
SELECT u.email, u.role, e.nom, e.prenom 
FROM "User" u 
JOIN "Employe" e ON u.id = e."userId" 
WHERE u.email = 'ali.benahmed@klbeton.tn';

-- ==============================================================
-- 📋 CREDENTIALS MEMO
-- ==============================================================
-- Email:    ali.benahmed@klbeton.tn
-- Password: test
-- ==============================================================
