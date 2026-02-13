
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const email = 'chef@klbeton.tn';
    const password = 'chefpassword123'; // Temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('--- Provisioning Chef Account ---');

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: 'CHEF'
        },
        create: {
            email,
            password: hashedPassword,
            role: 'CHEF'
        }
    });

    console.log('✅ User created/updated:', user.email);

    // 2. Create/Update Employe
    const employe = await prisma.employe.upsert({
        where: { employeeId: 'CHEF-001' },
        update: {
            nom: 'CHEF',
            prenom: 'DE CHANTIER',
            poste: 'Chef de Chantier',
            userId: user.id
        },
        create: {
            nom: 'CHEF',
            prenom: 'DE CHANTIER',
            poste: 'Chef de Chantier',
            employeeId: 'CHEF-001',
            dateEmbauche: new Date(),
            salaireBase: 1500,
            userId: user.id
        }
    });

    console.log('✅ Employee created/linked:', employe.nom, employe.prenom);
    console.log('---------------------------------');
    console.log('Login: ', email);
    console.log('Password: ', password);
}

main()
    .catch(e => {
        console.error('❌ Error during provisioning:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
