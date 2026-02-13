import bcrypt from 'bcryptjs';

const password = 'test';
const hashFromDB = '$2b$10$EGdStrFnG4DzDKRhoM4fIgJe/pE77dh2JXlt5D4GuXMh2y5M';

console.log('Testing password hash...');
console.log('Password:', password);
console.log('Hash:', hashFromDB);

bcrypt.compare(password, hashFromDB, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Match:', result);
        if (result) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does NOT match');
            // Generate correct hash
            const correctHash = bcrypt.hashSync(password, 10);
            console.log('Correct hash should be:', correctHash);
        }
    }
});
