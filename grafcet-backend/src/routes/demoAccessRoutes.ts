import express from 'express';
import { getPrisma } from '../services/prismaService.js';

const router = express.Router();

/**
 * POST /api/demo-access/request
 * Save a demo access request to the database
 */
router.post('/request', async (req, res) => {
    try {
        const { userId, email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        const prisma = getPrisma();

        // Check if user already requested
        const existingRequest = await prisma.demoAccessRequest.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });

        if (existingRequest && existingRequest.status === 'pending') {
            return res.json({
                success: true,
                message: 'You have already submitted a request. We will get back to you soon!',
                alreadyRequested: true
            });
        }

        // Create new request
        const newRequest = await prisma.demoAccessRequest.create({
            data: {
                userId: userId || null,
                email,
                name: name || null,
                status: 'pending'
            }
        });

        console.log(`[DemoAccess] New request from: ${email} (${name || 'No name'})`);

        res.status(201).json({
            success: true,
            message: 'Your request has been submitted! We will contact you soon.',
            data: {
                id: newRequest.id,
                email: newRequest.email,
                createdAt: newRequest.createdAt
            }
        });
    } catch (error: any) {
        console.error('Error saving demo access request:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save request',
            message: error.message
        });
    }
});

/**
 * GET /api/demo-access/list
 * Get all demo access requests (admin endpoint)
 */
router.get('/list', async (req, res) => {
    try {
        const prisma = getPrisma();
        const requests = await prisma.demoAccessRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: requests
        });
    } catch (error: any) {
        console.error('Error fetching demo access requests:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch requests'
        });
    }
});

export default router;

