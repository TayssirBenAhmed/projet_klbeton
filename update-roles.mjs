import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRoles() {
    try {
        // Mettre à jour Mohamed en ADMIN pour débloquer
        const user = await prisma.user.update({
            where: { email: 'mohamed.ali@klbeton.tn' },
            data: { role: 'ADMIN' }
        });
        console.log('User roles updated successfully:', user.email, 'is now', user.role);

        // Mettre à jour l'autre admin aussi if possible
        try {
            await prisma.user.update({
                where: { email: 'admin@klbeton.tn' },
                data: { role: 'ADMIN' }
            });
            console.log('admin@klbeton.tn is now ADMIN');
        } catch (e) { }

    } catch (error) {
        console.error('Error updating roles:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateRoles();
