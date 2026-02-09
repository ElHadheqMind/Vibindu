import 'dotenv/config';
import { AuthService } from './services/authService.js';
import { getPrisma } from './services/prismaService.js';

async function main() {
    console.log('Testing User Management system with Prisma + SQLite...');

    try {
        const email = 'testuser_' + Date.now() + '@example.com';
        console.log(`\nRegistering new user: ${email}`);

        const user = await AuthService.register(email, 'password123', 'Test User');
        console.log('✅ Registered successfully:', user);

        console.log('\nAttempting login...');
        const result = await AuthService.login(email, 'password123');
        console.log('✅ Login successful!');
        console.log('User:', result.user.name);
        console.log('Token:', result.token ? 'JWT Generated' : 'No Token');

    } catch (e: any) {
        console.error('❌ Error:', e.message);
    } finally {
        const prisma = getPrisma();
        await prisma.$disconnect();
    }
}

main();
