import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function debug() {
    try {
        console.log('--- DETAILED COLUMN CHECK (Avance) ---');
        const cols = await p.$queryRaw`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Avance'
            ORDER BY ordinal_position
        `;
        console.log('Actual columns in DB:', JSON.stringify(cols, null, 2));

        console.log('\n--- TRYING RAW UPDATE ON 57d27756-3199-49ed-8380-78a94fec94e0 ---');
        try {
            const res = await p.$executeRaw`
                UPDATE "Avance" 
                SET statut = 'APPROVED', "updatedAt" = NOW() 
                WHERE id = '57d27756-3199-49ed-8380-78a94fec94e0'
            `;
            console.log('Raw update result:', res);
        } catch (updateErr) {
            console.error('Raw update failed:', updateErr.message);
        }

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    } finally {
        await p.$disconnect();
    }
}

debug();
