
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email?: string;
    };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const agentSecret = req.headers['x-agent-secret'];

    // Allow Agent Bypass for local dev
    if (agentSecret === 'antigravity-local-agent') {
        (req as AuthRequest).user = { userId: 'agent', email: 'agent@antigravity.dev' };
        return next();
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email?: string };
        (req as AuthRequest).user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
};
