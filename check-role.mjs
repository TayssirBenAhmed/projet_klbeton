import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

try {
    const user = await p.user.findUnique({ where: { email: 'admin@klbeton.tn' } });
    console.log('USER ROLE:', user?.role);
} catch (e) {
    console.error('ERROR:', e.message);
} finally {
    await p.$disconnect();
}
