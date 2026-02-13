import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function debug() {
    try {
        console.log('--- ENUM CHECK ---');
        try {
            const enumVals = await p.$queryRaw`
                SELECT n.nspname as schema, t.typname as type, e.enumlabel as value
                FROM pg_type t 
                JOIN pg_enum e ON t.oid = e.enumtypid  
                JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
                WHERE t.typname = 'AvanceStatut'
            `;
            console.log('Enum values in DB:', enumVals);
        } catch (err) {
            console.log('Enum check failed (might not be an enum column yet):', err.message);
        }

        console.log('\n--- COLUMN METADATA ---');
        const cols = await p.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'Avance'
        `;
        console.log('Columns:', cols);

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    } finally {
        await p.$disconnect();
    }
}

debug();
