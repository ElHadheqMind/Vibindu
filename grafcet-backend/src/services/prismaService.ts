import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

let prisma: PrismaClient;

export const getPrisma = () => {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
};
