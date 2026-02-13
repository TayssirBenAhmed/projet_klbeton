const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log('🔄 Test de connexion à la base de données (kl_beton)...');

    try {
        // 1. Check connection
        await prisma.$connect();
        console.log('✅ Connexion Prisma réussie !');

        // 2. Check Users
        const userCount = await prisma.user.count();
        console.log(`📊 Nombre d'utilisateurs trouvés : ${userCount}`);

        if (userCount > 0) {
            const users = await prisma.user.findMany({
                select: { email: true, role: true },
                take: 5
            });
            console.log('Utilisateurs:', users);
        } else {
            console.log('⚠️ ATTENTION : La table User est vide ! Vous devez exécuter les scripts SQL.');
        }

        // 3. Check Geofences
        const geofenceCount = await prisma.geofence.count();
        console.log(`📍 Nombre de zones Geofence trouvées : ${geofenceCount}`);

        if (geofenceCount > 0) {
            const zones = await prisma.geofence.findMany({
                where: { isActive: true },
                select: { nom: true, radiusMeters: true }
            });
            console.log('Zones actives:', zones);
        } else {
            console.log('❌ Aucune zone Geofence configurée ! Le pointage hors zone est normal.');
        }

    } catch (error) {
        console.error('❌ ERREUR DE CONNEXION :', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
