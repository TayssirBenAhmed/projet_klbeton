import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'mahdi@gmail.com' },
            include: { employe: true }
        });

        if (!user) {
            console.log('❌ User NOT found in database');
            return;
        }

        console.log('✅ User found:', {
            email: user.email,
            role: user.role,
            hasEmploye: !!user.employe,
            passwordHash: user.password
        });

        // Test password
        const testPassword = 'test';
        const isValid = await bcrypt.compare(testPassword, user.password);

        console.log('\n🔐 Password test:');
        console.log('Password "test" matches:', isValid ? '✅ YES' : '❌ NO');

        if (!isValid) {
            console.log('\n🔧 Generating correct hash for "test":');
            const correctHash = await bcrypt.hash('test', 10);
            console.log('Correct hash:', correctHash);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
