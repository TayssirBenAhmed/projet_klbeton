// Test simple pour vérifier les variables d'environnement
console.log('=== VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT ===\n');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

console.log('\n=== TOUTES LES VARIABLES COMMENÇANT PAR DB ou DATABASE ===');
Object.keys(process.env)
    .filter(key => key.startsWith('DB') || key.startsWith('DATABASE'))
    .forEach(key => {
        console.log(`${key}:`, process.env[key]);
    });
