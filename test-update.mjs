import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function testUpdate() {
    const id = '7bea4bbd-7e9c-4ee6-95e2-a578786d3752'; // One of the IDs from the user's report
    try {
        console.log(`--- Testing Prisma Update for ID: ${id} ---`);
        const result = await p.avance.update({
            where: { id },
            data: { statut: 'APPROVED' }
        });
        console.log('Update success!', result);
    } catch (e) {
        console.error('Update FAILED');
        console.error('Message:', e.message);
        console.error('Code:', e.code);
        console.error('Meta:', JSON.stringify(e.meta));

        console.log('\n--- Checking row existence ---');
        const row = await p.avance.findUnique({ where: { id } });
        console.log('Row found:', row ? 'YES' : 'NO');
    } finally {
        await p.$disconnect();
    }
}

testUpdate();
