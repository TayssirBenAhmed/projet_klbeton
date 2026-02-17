import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    const email = 'admin@klbeton.tn';
    const password = 'admin';
    const hash = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hash, role: 'ADMIN' },
            create: {
                email,
                password: hash,
                role: 'ADMIN',
                employe: {
                    create: {
                        nom: 'Admin',
                        prenom: 'System',
                        poste: 'Administrateur',
                        email,
                        telephone: '00000000',
                        dateEmbauche: new Date(),
                        salaireBase: 0
                    }
                }
            }
        });
        console.log(`✅ Admin user ${email} reset with password "${password}"`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
