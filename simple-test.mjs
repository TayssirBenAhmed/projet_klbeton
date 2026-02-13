// Simple Database Connection Test
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'error'],
});

async function simpleTest() {
    try {
        console.log('DATABASE_URL:', process.env.DATABASE_URL);
        console.log('');

        // Test connection
        await prisma.$connect();
        console.log('✅ Connected to database');

        // Get database name
        const dbResult = await prisma.$queryRaw`SELECT current_database() as db`;
        console.log('Database:', dbResult[0].db);

        // Count employees
        const count = await prisma.employe.count();
        console.log('Total employees:', count);

        // Get last 3 employees
        const last3 = await prisma.employe.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { nom: true, prenom: true, createdAt: true }
        });

        console.log('\nLast 3 employees:');
        last3.forEach((emp, i) => {
            console.log(`${i + 1}. ${emp.prenom} ${emp.nom} - ${emp.createdAt}`);
        });

        await prisma.$disconnect();
        console.log('\n✅ Test completed successfully');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

simpleTest();
