-- ================================================
-- CREATE MAHDI TEST EMPLOYEE  
-- ================================================
-- Email:    mahdi@gmail.com
-- Password: test
-- ================================================

-- Clean up any existing user
DELETE FROM "Employe" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'mahdi@gmail.com');
DELETE FROM "User" WHERE email = 'mahdi@gmail.com';

-- Create User account
INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
VALUES (
    gen_random_uuid(),
    'mahdi@gmail.com',
    '$2b$10$J3zQtggmYWl3b/TMnBhwIlXgtAPj9IEm',
    'EMPLOYE',
    NOW(),
    NOW()
);

-- Create Employe record
INSERT INTO "Employe" (id, "userId", nom, prenom, poste, "dateEmbauche", "salaireBase", statut, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    (SELECT id FROM "User" WHERE email = 'mahdi@gmail.com'),
    'Mahdi',
    'Test',
    'Employee',
    NOW(),
    2000.00,
    'ACTIF',
    NOW(),
    NOW()
);

-- Verify creation
SELECT u.email, u.role, e.nom, e.prenom 
FROM "User" u 
LEFT JOIN "Employe" e ON u.id = e."userId" 
WHERE u.email = 'mahdi@gmail.com';

-- ================================================
-- ✅ LOGIN CREDENTIALS
-- ================================================
-- Email:    mahdi@gmail.com
-- Password: test
-- Login at: http://localhost:3000/employee-login
-- ================================================
