import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@klbeton.tn';
    const password = 'admin123';
    const hashedPassword = await hash(password, 10);

    console.log(`Resetting password for ${email}...`);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        console.log('✅ Password updated successfully!');
        console.log('New hash:', user.password);
    } catch (e) {
        console.error('Error updating password:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
