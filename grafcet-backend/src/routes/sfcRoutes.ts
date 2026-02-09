
import express from 'express';
import { sfcCompiler } from '../services/sfcCompiler.js';

const router = express.Router();

/**
 * POST /api/sfc/compile
 * Compile SFC DSL code into a GRAFCET Diagram
 */
router.post('/compile', async (req, res) => {
    try {
        const { code, title } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'SFC Code is required'
            });
        }

        const result = sfcCompiler.compile(code, title || 'Generated SFC');
        sfcCompiler.resolveJumps(); // Post-process connection targets

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: (result as any).error,
                details: (result as any).details
            });
        }

        res.json({
            success: true,
            generatedSFC: (result as any).generatedSFC,
            conductSFC: (result as any).conductSFC
        });

    } catch (error) {
        console.error('SFC Compilation Error:', error);
        res.status(500).json({
            success: false,
            error: 'Compilation failed',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

export default router;
