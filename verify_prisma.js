const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to count messages...");
        const count = await prisma.message.count();
        console.log(`Success! Message count: ${count}`);

        console.log("Attempting to fetch users...");
        const users = await prisma.user.findMany({ take: 1 });
        console.log(`Success! Found ${users.length} users.`);
    } catch (e) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
