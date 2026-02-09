/**
 * Render Routes - API endpoints for generating images and videos from spec.md
 * 
 * POST /api/render/image - Generate system diagram using Nano Banana Pro
 * POST /api/render/video - Start video generation using Veo 3.1
 * GET /api/render/video/status/:operationName - Check video generation status
 * POST /api/render/video/download - Download completed video
 */

import { Router, Request, Response } from 'express';
import { renderService } from '../services/renderService.js';

const router = Router();

/**
 * POST /api/render/image
 * Generate a system diagram image from spec.md using Nano Banana Pro
 */
router.post('/image', async (req: Request, res: Response) => {
    try {
        const { projectPath, customPrompt } = req.body;

        if (!projectPath) {
            return res.status(400).json({
                success: false,
                error: 'projectPath is required'
            });
        }

        console.log('[Render] Generating system image for:', projectPath);

        const result = await renderService.generateSystemImage(projectPath, customPrompt);

        if (result.success) {
            res.json({
                success: true,
                imagePath: result.imagePath,
                imageBase64: result.imageBase64,
                prompt: result.prompt
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }

    } catch (error: any) {
        console.error('[Render] Image generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/render/video
 * Start video generation using Veo 3.1 (returns operation name for polling)
 */
router.post('/video', async (req: Request, res: Response) => {
    try {
        const { projectPath, imageBase64, customPrompt } = req.body;

        if (!projectPath) {
            return res.status(400).json({
                success: false,
                error: 'projectPath is required'
            });
        }

        console.log('[Render] Starting video generation for:', projectPath);

        const result = await renderService.generateSystemVideo(projectPath, imageBase64, customPrompt);

        res.json({
            success: result.success,
            status: result.status,
            operationName: result.operationName,
            error: result.error,
            prompt: result.prompt
        });

    } catch (error: any) {
        console.error('[Render] Video generation error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * GET /api/render/video/status/:operationName
 * Check the status of a video generation operation
 */
router.get('/video/status/:operationName', async (req: Request, res: Response) => {
    try {
        const { operationName } = req.params;

        if (!operationName) {
            return res.status(400).json({
                success: false,
                error: 'operationName is required'
            });
        }

        const result = await renderService.checkVideoStatus(operationName);

        res.json({
            success: result.success,
            status: result.status,
            videoPath: result.videoPath,
            error: result.error
        });

    } catch (error: any) {
        console.error('[Render] Status check error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

/**
 * POST /api/render/video/download
 * Download completed video to project folder
 */
router.post('/video/download', async (req: Request, res: Response) => {
    try {
        const { videoUri, projectPath } = req.body;

        if (!videoUri || !projectPath) {
            return res.status(400).json({
                success: false,
                error: 'videoUri and projectPath are required'
            });
        }

        const result = await renderService.downloadVideo(videoUri, projectPath);

        res.json({
            success: result.success,
            status: result.status,
            videoPath: result.videoPath,
            error: result.error
        });

    } catch (error: any) {
        console.error('[Render] Download error:', error);
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message || 'Internal server error'
        });
    }
});

export default router;

