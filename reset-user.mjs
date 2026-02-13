import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function reset() {
    const email = 'benahmed.tayssir@klbeton.tn';
    const newPassword = 'Tayssir123';

    try {
        console.log(`Resetting password for ${email}...`);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        console.log('✅ Password successfully reset!');
        console.log(`Email: ${email}`);
        console.log(`New Password: ${newPassword}`);
    } catch (error) {
        console.error('❌ Error resetting password:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

reset();
