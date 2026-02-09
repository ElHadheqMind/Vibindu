
import express from 'express';
import { AuthService } from '../services/authService.js';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, username } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = await AuthService.register(email, password, name, username);
        res.status(201).json({ success: true, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const data = await AuthService.login(email, password);
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Login failed' });
    }
});

// Google Login
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, error: 'ID Token required' });
        }

        const data = await AuthService.googleLogin(idToken);
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('Google Login error:', error);
        res.status(401).json({ success: false, error: error instanceof Error ? error.message : 'Google Login failed' });
    }
});

// Get Current User
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = (req as AuthRequest).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        // You might want to fetch fresh user data here if needed, 
        // but for now we can just return what's in the token or basic info
        // Ideally, AuthService should have a getUserById

        res.json({ success: true, user: (req as AuthRequest).user });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
