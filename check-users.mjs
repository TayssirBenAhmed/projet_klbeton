import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany();
        console.log('--- Users in DB ---');
        for (const u of users) {
            console.log(`Email: ${u.email}, Role: ${u.role}, HashStart: ${u.password.substring(0, 10)}...`);

            // Test common passwords
            const isTest = await bcrypt.compare('test', u.password);
            const isAdmin = await bcrypt.compare('admin', u.password);
            const isAdmin123 = await bcrypt.compare('admin123', u.password);
            const isPassword = await bcrypt.compare('password', u.password);

            if (isTest) console.log(`   -> Password is "test"`);
            if (isAdmin) console.log(`   -> Password is "admin"`);
            if (isAdmin123) console.log(`   -> Password is "admin123"`);
            if (isPassword) console.log(`   -> Password is "password"`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
