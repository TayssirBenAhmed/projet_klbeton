
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const employes = await prisma.employe.findMany({
        select: {
            id: true,
            nom: true,
            prenom: true,
            poste: true,
            userId: true,
            user: {
                select: {
                    email: true,
                    role: true
                }
            }
        }
    });
    fs.writeFileSync('employes_snapshot.json', JSON.stringify(employes, null, 2));
    console.log('Employee snapshot written to employes_snapshot.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
