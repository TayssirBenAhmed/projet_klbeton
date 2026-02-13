import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    const users = await prisma.user.findMany({
        include: { employe: true }
    });

    console.log('--- USER DATA START ---');
    users.forEach(u => {
        console.log(`EMAIL: ${u.email} | ROLE: ${u.role} | NAME: ${u.employe?.prenom} ${u.employe?.nom}`);
    });
    console.log('--- USER DATA END ---');

    await prisma.$disconnect();
}

checkUser();
