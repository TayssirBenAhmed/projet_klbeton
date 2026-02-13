-- Check if mahdi user exists
SELECT u.id, u.email, u.role, LENGTH(u.password) as pass_length, e.nom, e.prenom
FROM "User" u
LEFT JOIN "Employe" e ON u.id = e."userId"
WHERE u.email = 'mahdi@gmail.com';
