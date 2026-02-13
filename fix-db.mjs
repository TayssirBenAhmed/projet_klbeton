import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function fix() {
    try {
        console.log('--- ADDING MISSING COLUMNS ---');
        // Add updatedAt if it doesn't exist
        await p.$executeRaw`ALTER TABLE "Avance" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP`;
        console.log('✅ Column "updatedAt" added successfully');

        // Add note if it doesn't exist (safety)
        await p.$executeRaw`ALTER TABLE "Avance" ADD COLUMN IF NOT EXISTS "note" TEXT`;
        console.log('✅ Column "note" ensured');

        // Add createdAt if it doesn't exist (safety)
        await p.$executeRaw`ALTER TABLE "Avance" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP`;
        console.log('✅ Column "createdAt" ensured');

    } catch (e) {
        console.error('❌ FIX ERROR:', e);
    } finally {
        await p.$disconnect();
    }
}

fix();
