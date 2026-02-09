import { getPrisma } from './prismaService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export class AuthService {
    static async register(email: string, password: string, name?: string, username?: string) {
        const prisma = getPrisma();

        // Check if user exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    ...(username ? [{ username }] : [])
                ]
            }
        });

        if (existing) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                name
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...result } = user;
        return result;
    }

    static async login(identifier: string, password: string) {
        const prisma = getPrisma();
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { username: identifier }
                ]
            }
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (!user.password) {
            throw new Error('Please login with Google');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            token
        };
    }

    static async seedDemoUser() {
        try {
            const prisma = getPrisma();
            const demoUser = await prisma.user.findUnique({ where: { username: 'demo' } });
            if (!demoUser) {
                const hashedPassword = await bcrypt.hash('demo123', 10);
                await prisma.user.create({
                    data: {
                        username: 'demo',
                        email: 'demo@grafcet-editor.com',
                        password: hashedPassword,
                        name: 'Demo User'
                    }
                });
                console.log('Demo user created');
            }
        } catch (error) {
            console.error('Error seeding demo user:', error);
        }
    }

    static async googleLogin(idToken: string) {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);

        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (error) {
            console.error('Google verify error:', error);
            // If verification fails (e.g. dev environment without real client ID), 
            // we optionally allow a bypass for specific dev tokens if needed, 
            // OR just fail. 
            throw new Error('Invalid Google Token');
        }

        if (!payload || !payload.email) throw new Error('Invalid Google Token Payload');

        const { email, name, sub: googleId } = payload;
        const prisma = getPrisma();

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || '',
                    googleId,
                    password: null // Google users might not have a password
                }
            });
        } else if (!user.googleId) {
            // Link account
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId }
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
}

