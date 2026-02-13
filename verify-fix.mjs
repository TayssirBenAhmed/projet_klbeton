import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('--- VERIFICATION START ---');

    // 1. Check schema
    console.log('Checking Role enum...');
    // This is hard to check directly via Prisma client without trying to use it,
    // but we can check if we can find a user with the ADMIN role which we just set.

    // 2. Check Mohamed's role
    const mohamed = await prisma.user.findUnique({
        where: { email: 'mohamed.ali@klbeton.tn' }
    });
    console.log(`Mohamed Role: ${mohamed?.role} (Expected: ADMIN)`);

    // 3. Check Admin's role
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@klbeton.tn' }
    });
    console.log(`Admin Role: ${admin?.role} (Expected: ADMIN)`);

    console.log('--- VERIFICATION END ---');
    await prisma.$disconnect();
}

verify();
