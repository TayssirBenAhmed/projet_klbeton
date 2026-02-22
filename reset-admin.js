const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function reset() {
    const email = 'admin@klbeton.tn';
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    try {
        await prisma.user.upsert({
            where: { email: email },
            update: { password: hashedPassword },
            create: {
                id: 'admin-fix',
                email: email,
                password: hashedPassword,
                role: 'ADMIN',
                mustChangePassword: false,
                twoFactorEnabled: false
            },
        });
        console.log('✅ MOT DE PASSE RÉINITIALISÉ AVEC SUCCÈS !');
        console.log('Email : ' + email);
        console.log('Nouveau mot de passe : ' + plainPassword);
    } catch (error) {
        console.error('❌ Erreur :', error);
    } finally {
        await prisma.$disconnect();
    }
}

reset();