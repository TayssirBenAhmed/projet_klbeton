const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = await hash('password123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'test-employee@klbeton.tn' },
        update: { password },
        create: {
            email: 'test-employee@klbeton.tn',
            password,
            role: 'EMPLOYE',
            employe: {
                create: {
                    nom: 'Test',
                    prenom: 'Employee',
                    poste: 'Tester',
                    salaireBase: 1200,
                    dateEmbauche: new Date(),
                    statut: 'ACTIF'
                }
            }
        },
    });
    console.log(`Created user: ${user.email}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
