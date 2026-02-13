// Better Database Connection Test
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env to be sure what's in the file vs environment
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        console.log('--- .env file content check ---');

        const lines = envFile.split('\n');
        for (const line of lines) {
            if (line.startsWith('DATABASE_URL')) {
                console.log('Raw line in file:', line.trim());
            }
        }

        // Simple manual parse for this test
        const dbUrlLine = lines.find(l => l.startsWith('DATABASE_URL='));
        if (dbUrlLine) {
            const val = dbUrlLine.split('=')[1].trim();
            process.env.DATABASE_URL = val;
            console.log('Manually set process.env.DATABASE_URL to:', val);
        }
        console.log('-------------------------------\n');
    } catch (e) {
        console.error('Error reading .env:', e.message);
    }
}

loadEnv();

const prisma = new PrismaClient({
    log: ['info'],
});

async function runTest() {
    try {
        console.log('Testing connection to DATABASE_URL...');

        await prisma.$connect();
        console.log('✅ Connected successfully!');

        const dbName = await prisma.$queryRaw`SELECT current_database() as db`;
        console.log('Connected to database:', dbResultToString(dbName));

        const count = await prisma.employe.count();
        console.log('Employee count:', count);

        // List employees to verify consistency
        const emps = await prisma.employe.findMany({
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { id: true, nom: true, prenom: true }
        });

        console.log('Recent employees:', JSON.stringify(emps, null, 2));

        await prisma.$disconnect();
    } catch (e) {
        console.error('❌ Connection failed:', e);
    }
}

function dbResultToString(res) {
    if (Array.isArray(res) && res.length > 0) return res[0].db;
    return JSON.stringify(res);
}

runTest();
