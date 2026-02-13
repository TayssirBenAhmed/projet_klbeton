-- ================================================
-- FIX MAHDI PASSWORD
-- ================================================
-- This updates the password to: test
-- ================================================

UPDATE "User" 
SET password = '$2b$10$i4Tm5Y3ezSAnj0.3VOMk29M4'
WHERE email = 'mahdi@gmail.com';

-- Verify the update
SELECT email, role, LENGTH(password) as hash_length 
FROM "User" 
WHERE email = 'mahdi@gmail.com';
