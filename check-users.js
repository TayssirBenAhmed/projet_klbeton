const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { email: true, role: true }
        });
        console.log('Utilisateurs trouvés :', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('Erreur:', e);
    } finally {
        await prisma.$disconnect();
    }
}
listUsers();
