
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Hardcoded with the password we asked user to set: 'postgres'
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5432/kl_beton?schema=public"
        }
    }
});

async function main() {
    console.log('🔄 Fixing admin account...');

    try {
        const email = 'admin@klbeton.tn';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Hashing password '${password}'...`);

        // Check availability
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('❌ Admin user not found in DB! Creating it...');
            await prisma.user.create({
                data: {
                    id: 'admin-id-123', // fixed ID for ease
                    email,
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin user created.');
        } else {
            console.log('User found. Updating password...');
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log('✅ Password updated successfully.');
        }

        // Verify
        const updatedUser = await prisma.user.findUnique({ where: { email } });
        const isValid = await bcrypt.compare(password, updatedUser.password);

        if (isValid) {
            console.log('✅ Verification successful: Password matches hash.');
        } else {
            console.error('❌ Verification failed! Hash mismatch.');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
