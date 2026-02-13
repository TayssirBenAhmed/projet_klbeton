// Script pour générer un hash bcrypt et créer/mettre à jour un admin
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrUpdateAdmin() {
    const email = 'admin@klbeton.tn'; // CHANGE THIS if needed
    const password = 'admin123'; // CHANGE THIS to your desired password

    console.log(`\n🔐 Création/Mise à jour du compte admin...`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);

    try {
        // Generate bcrypt hash
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`✅ Hash généré: ${hashedPassword}\n`);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            // Update existing user
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Mot de passe mis à jour pour ${email}`);
        } else {
            // Create new user
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Nouveau compte admin créé: ${email}`);

            // Create associated Employe record
            await prisma.employe.create({
                data: {
                    userId: user.id,
                    nom: 'Admin',
                    prenom: 'Système',
                    poste: 'Administrateur',
                    dateEmbauche: new Date(),
                    salaireBase: 0,
                    statut: 'ACTIF'
                }
            });
            console.log(`✅ Profil employé créé`);
        }

        console.log(`\n🎉 SUCCESS! Vous pouvez maintenant vous connecter avec:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}\n`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createOrUpdateAdmin();
