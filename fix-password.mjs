import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPassword() {
    const email = 'mahdi@gmail.com';
    const password = 'test';

    // Generate the correct hash
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash length:', hash.length);

    // Update the user password directly in database
    const updated = await prisma.user.update({
        where: { email },
        data: { password: hash }
    });

    console.log('Updated user:', updated.email);

    // Verify it works
    const user = await prisma.user.findUnique({ where: { email } });
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password verification:', isValid ? '✅ SUCCESS' : '❌ FAILED');

    await prisma.$disconnect();
}

fixPassword();
