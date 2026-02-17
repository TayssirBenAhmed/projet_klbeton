import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkChef() {
    try {
        const email = 'chef@klbeton.tn';
        const user = await prisma.user.findUnique({
            where: { email },
            include: { employe: true }
        });

        if (!user) {
            console.log(`❌ User ${email} does NOT exist.`);
        } else {
            console.log(`✅ User found:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Employe ID: ${user.employeId}`);
            console.log(`   Hash: ${user.password.substring(0, 15)}...`);

            // Test 'chef' password
            const isChef = await bcrypt.compare('chef', user.password);
            const isChef123 = await bcrypt.compare('chef123', user.password);

            console.log(`   Password is 'chef': ${isChef}`);
            console.log(`   Password is 'chef123': ${isChef123}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkChef();
