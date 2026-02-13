-- Script pour créer une zone Geofence de TEST avec un rayon de 5km (pour permettre le pointage de partout)
-- À exécuter dans pgAdmin sur la base 'kl_beton'

INSERT INTO "Geofence" (id, nom, description, "centerLat", "centerLng", "radiusMeters", "isActive", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'Zone Test - Global',
    'Zone de test avec rayon étendu de 5km pour tests de pointage',
    33.8815,  -- Coordonnées approximatives de Gabès, Tunisie
    10.0982,
    5000,     -- Rayon de 5km (5000 mètres) - Très large pour tests
    true,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Vérification
SELECT id, nom, "radiusMeters", "isActive" FROM "Geofence" WHERE "isActive" = true;
