import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testEmployeeCreation() {
    console.log('\n=== TEST COMPLET DE CRÉATION D\'EMPLOYÉ ===\n');

    try {
        // Test 1: Vérifier la connexion
        console.log('Test 1: Vérification de la connexion à la base de données...');
        await prisma.$connect();
        const dbInfo = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
        console.log('✓ Connecté à:', dbInfo);

        // Test 2: Compter les employés AVANT
        console.log('\nTest 2: Comptage des employés AVANT insertion...');
        const countBefore = await prisma.employe.count();
        console.log(`✓ Nombre d'employés AVANT: ${countBefore}`);

        // Test 3: Créer un employé de test
        console.log('\nTest 3: Création d\'un employé de test...');
        const testEmployee = {
            nom: 'DIAGNOSTIC',
            prenom: 'Test Web Interface',
            poste: 'Testeur',
            dateEmbauche: new Date(),
            salaireBase: 1500.0,
            statut: 'ACTIF',
            soldeConges: 18,
            soldeMaladie: 10,
        };

        console.log('Données à insérer:', testEmployee);

        const created = await prisma.employe.create({
            data: testEmployee
        });

        console.log('✓ Employé créé avec succès!');
        console.log('ID généré:', created.id);
        console.log('Timestamp création:', created.createdAt);

        // Test 4: Vérifier que l'employé a été créé
        console.log('\nTest 4: Vérification de la création...');
        const countAfter = await prisma.employe.count();
        console.log(`✓ Nombre d'employés APRÈS: ${countAfter}`);
        console.log(`Différence: +${countAfter - countBefore}`);

        // Test 5: Lire l'employé créé
        console.log('\nTest 5: Lecture de l\'employé créé...');
        const retrieved = await prisma.employe.findUnique({
            where: { id: created.id }
        });

        if (retrieved) {
            console.log('✓ Employé retrouvé:', {
                id: retrieved.id,
                nom: retrieved.nom,
                prenom: retrieved.prenom,
                createdAt: retrieved.createdAt
            });
        } else {
            console.log('✗ ERREUR: Employé non retrouvé après création!');
        }

        // Test 6: Lister les 5 derniers employés
        console.log('\nTest 6: Liste des 5 derniers employés créés...');
        const latestEmployees = await prisma.employe.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                nom: true,
                prenom: true,
                poste: true,
                createdAt: true
            }
        });

        console.log('Derniers employés:');
        latestEmployees.forEach((emp, idx) => {
            console.log(`  ${idx + 1}. ${emp.nom} ${emp.prenom} (${emp.poste}) - ${emp.createdAt}`);
        });

        // Test 7: Supprimer l'employé de test
        console.log('\nTest 7: Nettoyage - Suppression de l\'employé de test...');
        await prisma.employe.delete({
            where: { id: created.id }
        });
        console.log('✓ Employé de test supprimé');

        // Résumé final
        console.log('\n=== RÉSUMÉ ===');
        console.log('✓ Base de données: CONNECTÉE et FONCTIONNELLE');
        console.log('✓ Création: RÉUSSIE');
        console.log('✓ Lecture: RÉUSSIE');
        console.log('✓ Suppression: RÉUSSIE');
        console.log('\n⚠ Si vos employés de l\'interface n\'apparaissent pas:');
        console.log('  1. Vérifiez que le serveur Next.js utilise bien ce fichier .env');
        console.log('  2. Redémarrez le serveur (npm run dev)');
        console.log('  3. Vérifiez dans pgAdmin que vous êtes sur la MÊME base de données');

    } catch (error) {
        console.error('\n✗ ERREUR DÉTECTÉE:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

console.log('DATABASE_URL:', process.env.DATABASE_URL);
testEmployeeCreation();
