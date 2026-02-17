import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetChef() {
    const email = 'chef@klbeton.tn';
    const password = 'chef';
    const hash = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { password: hash, role: 'CHEF' },
            create: {
                email,
                password: hash,
                role: 'CHEF',
                employe: {
                    create: {
                        nom: 'Chef',
                        prenom: 'Chantier',
                        poste: 'Chef de Chantier',
                        telephone: '00000000',
                        dateEmbauche: new Date(),
                        salaireBase: 0
                    }
                }
            }
        });
        console.log(`✅ Chef user ${email} reset with password "${password}"`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetChef();
