const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const employes = await prisma.employe.findMany({ include: { user: true } });
        console.log(`Total employes: ${employes.length}`);

        const matricules = employes.map(e => e.employeeId).filter(Boolean);
        const emails = employes.map(e => e.user?.email).filter(Boolean);

        const dupMat = matricules.filter((item, index) => matricules.indexOf(item) !== index);
        const dupEmail = emails.filter((item, index) => emails.indexOf(item) !== index);

        if (dupMat.length > 0) console.log('DUPLICATE MATRICULES:', dupMat);
        else console.log('No duplicate matricules.');

        if (dupEmail.length > 0) console.log('DUPLICATE EMAILS:', dupEmail);
        else console.log('No duplicate emails.');

        const emptyMat = employes.filter(e => e.employeeId === '').length;
        console.log(`Employees with empty string matricule (""): ${emptyMat}`);

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}
checkData();
