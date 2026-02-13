import bcrypt from 'bcryptjs';

const password = 'test';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
