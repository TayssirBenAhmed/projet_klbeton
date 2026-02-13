// Diagnostic complet de connexion base de données
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function diagnosticComplet() {
    console.log('=== DIAGNOSTIC COMPLET DE CONNEXION ===\n');

    // 1. Vérifier DATABASE_URL
    console.log('1. DATABASE_URL:');
    console.log('   ', process.env.DATABASE_URL);
    console.log('');

    // 2. Test de connexion basique
    console.log('2. Test de connexion basique:');
    try {
        await prisma.$connect();
        console.log('   ✅ Connexion réussie');
    } catch (error) {
        console.log('   ❌ Échec de connexion:', error.message);
        process.exit(1);
    }
    console.log('');

    // 3. Vérifier la base de données actuelle
    console.log('3. Base de données actuelle:');
    try {
        const result = await prisma.$queryRaw`SELECT current_database()`;
        console.log('   Base:', result[0].current_database);
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }
    console.log('');

    // 4. Compter les employés
    console.log('4. Nombre d\'employés dans la base:');
    try {
        const count = await prisma.employe.count();
        console.log('   Total:', count, 'employés');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }
    console.log('');

    // 5. Lister les 5 derniers employés
    console.log('5. Les 5 derniers employés créés:');
    try {
        const employes = await prisma.employe.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                nom: true,
                prenom: true,
                poste: true,
                createdAt: true,
            }
        });

        if (employes.length === 0) {
            console.log('   ⚠️  Aucun employé trouvé');
        } else {
            employes.forEach((emp, index) => {
                console.log(`   ${index + 1}. ${emp.prenom} ${emp.nom} - ${emp.poste}`);
                console.log(`      Créé le: ${emp.createdAt.toISOString()}`);
            });
        }
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }
    console.log('');

    // 6. Tester la création d'un employé de test
    console.log('6. Test de création d\'employé:');
    try {
        const testEmploye = await prisma.employe.create({
            data: {
                nom: 'TEST_DIAGNOSTIC',
                prenom: 'Employé',
                poste: 'Test Connexion',
                dateEmbauche: new Date(),
                salaireBase: 1500,
            }
        });
        console.log('   ✅ Employé de test créé avec ID:', testEmploye.id);
        console.log('   ⚠️  Vérifiez maintenant dans pgAdmin si cet employé apparaît!');

        // Supprimer l'employé de test
        await prisma.employe.delete({ where: { id: testEmploye.id } });
        console.log('   ✅ Employé de test supprimé');
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }
    console.log('');

    // 7. Vérifier les tables disponibles
    console.log('7. Tables dans le schéma public:');
    try {
        const tables = await prisma.$queryRaw`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `;
        tables.forEach(table => {
            console.log('   -', table.tablename);
        });
    } catch (error) {
        console.log('   ❌ Erreur:', error.message);
    }
    console.log('');

    console.log('=== FIN DU DIAGNOSTIC ===');

    await prisma.$disconnect();
}

diagnosticComplet()
    .catch(error => {
        console.error('Erreur fatale:', error);
        process.exit(1);
    });
