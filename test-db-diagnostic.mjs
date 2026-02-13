import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testDatabaseConnection() {
    console.log('=== TESTING DATABASE CONNECTION ===\n');

    try {
        // Test 1: Database Connection
        console.log('Test 1: Checking database connection...');
        await prisma.$connect();
        console.log('✓ Database connected successfully\n');

        // Test 2: Count existing employees
        console.log('Test 2: Counting existing employees...');
        const employeeCount = await prisma.employe.count();
        console.log(`✓ Found ${employeeCount} employees in database\n`);

        // Test 3: List all employees
        console.log('Test 3: Listing all employees...');
        const employees = await prisma.employe.findMany({
            select: {
                id: true,
                nom: true,
                prenom: true,
                poste: true,
                statut: true,
            }
        });
        console.log('Employees in database:');
        employees.forEach((emp, idx) => {
            console.log(`  ${idx + 1}. ${emp.nom} ${emp.prenom} (${emp.poste}) - ${emp.statut}`);
        });
        console.log('');

        // Test 4: Create a test employee
        console.log('Test 4: Creating a test employee...');
        const testEmployee = await prisma.employe.create({
            data: {
                nom: 'TEST',
                prenom: 'Database',
                poste: 'Test Engineer',
                dateEmbauche: new Date(),
                salaireBase: 1000.0,
                statut: 'ACTIF',
                soldeConges: 18,
                soldeMaladie: 10,
            }
        });
        console.log(`✓ Test employee created with ID: ${testEmployee.id}\n`);

        // Test 5: Verify the employee was created
        console.log('Test 5: Verifying test employee exists...');
        const verifyEmployee = await prisma.employe.findUnique({
            where: { id: testEmployee.id }
        });
        if (verifyEmployee) {
            console.log(`✓ Test employee verified: ${verifyEmployee.nom} ${verifyEmployee.prenom}\n`);
        } else {
            console.log('✗ Test employee NOT found after creation!\n');
        }

        // Test 6: Delete test employee
        console.log('Test 6: Cleaning up test employee...');
        await prisma.employe.delete({
            where: { id: testEmployee.id }
        });
        console.log('✓ Test employee deleted\n');

        console.log('=== ALL TESTS PASSED ===');
        console.log('Database connection is working correctly!');
        console.log('\nIf employees are not showing in pgAdmin, please:');
        console.log('1. Refresh your pgAdmin view (F5)');
        console.log('2. Check you are connected to the correct database: kl_beton');
        console.log('3. Verify the schema is "public"');

    } catch (error) {
        console.error('✗ TEST FAILED:', error.message);
        console.error('\nFull error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDatabaseConnection();
