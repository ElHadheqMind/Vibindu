import express from 'express';
import path from 'path';
import { getStorageService } from '../services/storageService.js';
import { FileSystemService } from '../services/fileSystemService.js';

const router = express.Router();
const storage = getStorageService();

// Filename for vibe chat conversations storage
const VIBE_CHAT_FILENAME = 'vibe-chat.json';

/**
 * Conversation message interface
 */
interface ConversationMessage {
    id: string;
    text: string;
    isUser: boolean;
    agent?: string;
    timestamp: string;
    isThinking?: boolean;
    isTask?: boolean;
    task?: string;
    isTool?: boolean;
    tool?: string;
    isToolCall?: boolean;
    toolName?: string;
    toolParams?: Record<string, unknown>;
    isToolResult?: boolean;
    toolResult?: Record<string, unknown>;
}

/**
 * Conversation interface
 */
interface Conversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: ConversationMessage[];
    metadata: {
        model: string;
        mode: string;
        thinkingLevel: number;
    };
}

/**
 * Conversations file structure
 */
interface ConversationsData {
    version: string;
    conversations: Conversation[];
    activeConversationId: string | null;
    updatedAt: string;
}

/**
 * POST /api/vibe/save
 * Save vibe chat conversations to a JSON file in the project directory
 */
router.post('/save', async (req, res) => {
    try {
        const { projectPath, conversations, activeConversationId } = req.body;

        if (!projectPath) {
            return res.status(400).json({
                success: false,
                error: 'Project path is required'
            });
        }

        // Validate project path exists
        const isValidPath = await FileSystemService.validatePath(projectPath);
        if (!isValidPath) {
            return res.status(404).json({
                success: false,
                error: 'Project path not found'
            });
        }

        const relativePath = storage.getRelativePath(projectPath);
        const vibeChatFilePath = path.join(relativePath, VIBE_CHAT_FILENAME).replace(/\\/g, '/');

        // Build data to save
        const dataToSave: ConversationsData = {
            version: '1.0.0',
            conversations: conversations || [],
            activeConversationId: activeConversationId || null,
            updatedAt: new Date().toISOString()
        };

        // Write file
        await storage.writeJson(vibeChatFilePath, dataToSave);

        console.log(`[VibeChatRoutes] Saved ${conversations?.length || 0} conversations to ${vibeChatFilePath}`);

        res.json({
            success: true,
            savedPath: storage.getAbsolutePath(vibeChatFilePath),
            conversationCount: conversations?.length || 0
        });
    } catch (error) {
        console.error('Error saving vibe chat:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/vibe/load
 * Load vibe chat conversations from the project directory
 */
router.post('/load', async (req, res) => {
    try {
        const { projectPath } = req.body;

        if (!projectPath) {
            return res.status(400).json({
                success: false,
                error: 'Project path is required'
            });
        }

        const relativePath = storage.getRelativePath(projectPath);
        const vibeChatFilePath = path.join(relativePath, VIBE_CHAT_FILENAME).replace(/\\/g, '/');

        // Check if file exists
        if (!await storage.exists(vibeChatFilePath)) {
            // It's okay if it doesn't exist, return empty data
            return res.json({
                success: true,
                data: null
            });
        }

        // Read file
        const data = await storage.readJson<ConversationsData>(vibeChatFilePath);

        console.log(`[VibeChatRoutes] Loaded ${data.conversations?.length || 0} conversations from ${vibeChatFilePath}`);

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error loading vibe chat:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;

