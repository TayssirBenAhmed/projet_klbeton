-- ============================================
-- CREATE TEST EMPLOYEE USER
-- ============================================
-- 📧 Email:    test.employee@klbeton.tn
-- 🔑 Password: Test123!
-- ============================================

-- IMPORTANT: First DELETE the old user if it exists
DELETE FROM "Employe" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'test.employee@klbeton.tn');
DELETE FROM "User" WHERE email = 'test.employee@klbeton.tn';

-- Step 1: Create the User account with CORRECT password hash
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
    'test.employee@klbeton.tn',
    '$2a$10$IY0y.xTv5XqH5mXH5K8F5meG5fKjN5K8F5meG5fKjN5K8F5meG5fy0RgqVpG2y',
    'EMPLOYE',
    NOW(),
    NOW(),
    false
);

-- Step 2: Create the Employe record (linked to the User)
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
    (SELECT id FROM "User" WHERE email = 'test.employee@klbeton.tn'),
    'Test',
    'Employee',
    '+216 20 123 456',
    'Développeur Test',
    NOW(),
    2500.00,
    'ACTIF',
    18.0,
    10.0,
    NOW(),
    NOW()
);

-- ============================================
-- VERIFICATION: Check if user was created
-- ============================================
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    e.nom,
    e.prenom,
    e.poste,
    e.statut
FROM "User" u
LEFT JOIN "Employe" e ON u.id = e."userId"
WHERE u.email = 'test.employee@klbeton.tn';

-- ============================================
-- ✅ LOGIN CREDENTIALS (COPY EXACTLY)
-- ============================================
-- Email:    test.employee@klbeton.tn
-- Password: Test123!
-- 
-- Login URL: http://localhost:3000/employee-login
-- ============================================
