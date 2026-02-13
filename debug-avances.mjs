import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function debug() {
    try {
        console.log('--- DB SCHEMA CHECK (Avance) ---');
        const cols = await p.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Avance'`;
        console.log('Columns found in DB:', cols);

        console.log('\n--- DATA CHECK ---');
        const count = await p.avance.count();
        console.log('Total Avance count:', count);

        const all = await p.$queryRaw`SELECT * FROM "Avance" LIMIT 5`;
        console.log('Raw data sample:', all);

        // Check Statut values
        const statuts = await p.$queryRaw`SELECT DISTINCT statut FROM "Avance"`;
        console.log('Distinct status values in DB:', statuts);

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    } finally {
        await p.$disconnect();
    }
}

debug();
