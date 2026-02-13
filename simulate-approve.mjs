import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function simulateApi() {
    const id = '1280d2e9-ba21-412f-9d3e-286eee603d22'; // Another ID from user report
    const statut = 'APPROVED';

    console.log('--- Simulating Approval API ---');
    try {
        // 1. We know role is ADMIN from previous check
        console.log('Role check passed (SIMULATED)');

        // 2. Run SQL Update
        console.log(`Running SQL update for ${id}...`);
        const result = await p.$executeRawUnsafe(
            `UPDATE "Avance" SET statut = $1::"AvanceStatut", "updatedAt" = NOW() WHERE id = $2`,
            statut,
            id
        );
        console.log('SQL Result:', result);

        // 3. Find unique
        const row = await p.avance.findUnique({
            where: { id },
            include: { employe: true }
        });
        console.log('Resulting Row:', row?.id, row?.statut);

    } catch (e) {
        console.error('SIMULATION FAILED');
        console.error(e);
    } finally {
        await p.$disconnect();
    }
}

simulateApi();
