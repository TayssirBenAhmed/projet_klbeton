
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true
        }
    });
    fs.writeFileSync('users_snapshot.json', JSON.stringify(users, null, 2));
    console.log('User snapshot written to users_snapshot.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
