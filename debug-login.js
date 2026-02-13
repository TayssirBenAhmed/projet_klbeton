const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAuth() {
    const email = 'mohamed.ali@klbeton.tn';
    const passwordAttempt = 'admin';

    console.log(`🔍 Vérification pour ${email}...`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { employe: true }
        });

        if (!user) {
            console.log('❌ Utilisateur non trouvé dans la base de données !');
            return;
        }

        console.log('✅ Utilisateur trouvé.');
        console.log('🔑 Hash en base:', user.password);

        const isValid = await bcrypt.compare(passwordAttempt, user.password);
        console.log(`📢 Test mot de passe "${passwordAttempt}":`, isValid ? '✅ VALIDE' : '❌ INVALIDE');

        if (!isValid) {
            console.log('\n🔄 Réinitialisation du mot de passe à "admin"...');
            const newHash = await bcrypt.hash('admin', 10);
            await prisma.user.update({
                where: { email },
                data: { password: newHash }
            });
            console.log('✅ Mot de passe réinitialisé à "admin". Réessayez de vous connecter.');
        }

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAuth();
