import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }

        const newMessage = await prisma.contactMessage.create({
            data: {
                name,
                email,
                message
            }
        });

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error: any) {
        console.error('Error saving contact message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save message',
            message: error.message
        });
    }
});

export default router;
