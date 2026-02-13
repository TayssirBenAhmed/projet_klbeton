
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            // Using IPv6 loopback
            url: "postgresql://postgres:postgres@[::1]:5432/kl_beton?schema=public"
        }
    }
});

async function main() {
    console.log('🔄 Testing IPv6 Connection ([::1])...');

    try {
        await prisma.$connect();
        console.log('✅ SUCCESS! Connected via IPv6.');

        const count = await prisma.user.count();
        console.log(`Found ${count} users.`);

        // Since we are here, let's reset the password to be sure
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.update({
            where: { email: 'admin@klbeton.tn' },
            data: { password: hashedPassword }
        });
        console.log('✅ Admin password reset to "admin123".');

    } catch (e) {
        console.error('❌ Failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
