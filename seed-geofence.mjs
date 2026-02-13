import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SEEDING GEOFENCE ---');

    const targetName = 'POLYCLINIQUE ARIJ DJERBA - Midoun';

    const existing = await prisma.geofence.findFirst({
        where: { nom: targetName }
    });

    let geofence;
    if (existing) {
        geofence = await prisma.geofence.update({
            where: { id: existing.id },
            data: {
                centerLat: 33.8081,
                centerLng: 10.9923,
                radiusMeters: 200,
                isActive: true,
                description: 'Polyclinique Arij - Zone de pointage automatique'
            }
        });
        console.log('Geofence updated:', geofence);
    } else {
        geofence = await prisma.geofence.create({
            data: {
                nom: targetName,
                centerLat: 33.8081,
                centerLng: 10.9923,
                radiusMeters: 200,
                isActive: true,
                description: 'Polyclinique Arij - Zone de pointage automatique'
            }
        });
        console.log('Geofence created:', geofence);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
