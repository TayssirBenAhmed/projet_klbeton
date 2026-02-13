-- Fix : Mettre à jour le rôle de Mohamed Ali en ADMIN pour accéder aux fonctions d'administration

UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'mohamed.ali@klbeton.tn';

-- Vérification
SELECT email, role FROM "User" WHERE email IN ('mohamed.ali@klbeton.tn', 'mahdi@klbeton.tn');
