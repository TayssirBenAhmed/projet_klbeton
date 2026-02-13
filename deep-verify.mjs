import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deepVerify() {
    try {
        console.log('--- APPLICATION DATABASE INFO ---');
        console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

        // Get database name, port and version
        const info = await prisma.$queryRaw`
      SELECT 
        current_database() as db,
        current_setting('port') as port,
        version() as version,
        inet_server_addr() as address
    `;

        console.log('Database:', info[0].db);
        console.log('Port:', info[0].port);
        console.log('Address:', info[0].address || 'localhost');
        console.log('Version:', info[0].version.split(',')[0]);

        // Create a VERY unique employee to find in pgAdmin
        const uniqueId = 'VERIF-' + Date.now();
        const testEmp = await prisma.employe.create({
            data: {
                nom: 'TEST_CONNECTION',
                prenom: uniqueId,
                poste: 'VERIFICATION',
                dateEmbauche: new Date(),
                salaireBase: 9999,
                user: {
                    create: {
                        email: uniqueId.toLowerCase() + '@test.com',
                        password: 'password123',
                        role: 'ADMIN'
                    }
                }
            }
        });

        console.log('\n--- VERIFICATION ACTION ---');
        console.log('✅ Created unique employee with prenom:', uniqueId);
        console.log('Please run this query in pgAdmin:');
        console.log(`SELECT * FROM public."Employe" WHERE prenom = '${uniqueId}';`);

        const count = await prisma.employe.count();
        console.log('\nTotal employees in this DB:', count);

    } catch (e) {
        console.log('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

deepVerify();
