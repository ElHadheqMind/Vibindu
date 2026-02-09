import express, { Request } from 'express';
import path from 'path';
import { FileSystemService } from '../services/fileSystemService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import {
  CreateProjectRequest,
  SaveProjectRequest,
  LoadProjectRequest,
  CreateProjectResponse,
  SaveProjectResponse,
  LoadProjectResponse,
  ListProjectsResponse
} from '../types/index.js';

const router = express.Router();

/**
 * POST /api/projects/create
 * Create a new project with local folder structure
 */
router.post('/create', async (req: Request, res) => {
  try {
    const authReq = req as AuthRequest;
    const createRequest: CreateProjectRequest = req.body;
    const userId = authReq.user?.userId;

    // Validate request
    if (!createRequest.name || !createRequest.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and type are required'
      } as CreateProjectResponse);
    }

    // Force user isolation
    if (userId) {
      const baseStorage = FileSystemService.getBaseStoragePath();
      const userDir = path.join(baseStorage, 'users', userId);

      // Ensure user directory exists
      await FileSystemService.ensureDirectory(userDir);

      createRequest.localPath = userDir;
      console.log(`[CreateProject] Enforcing user path: ${createRequest.localPath}`);
    } else {
      // Fallback for non-authenticated (shouldn't happen due to middleware)
      if (!createRequest.localPath) {
        createRequest.localPath = FileSystemService.getBaseStoragePath();
      }
    }

    // Validate project type
    if (createRequest.type !== 'grafcet' && createRequest.type !== 'gsrsm') {
      return res.status(400).json({
        success: false,
        error: 'Invalid project type. Must be "grafcet" or "gsrsm"'
      } as CreateProjectResponse);
    }

    // Validate local path: check if the parent directory exists and is accessible
    // If the localPath is the base path, we should validate it directly
    const isValidPath = await FileSystemService.validatePath(createRequest.localPath);
    if (!isValidPath) {
      // Try to create it if it's the user dir
      if (userId) {
        await FileSystemService.ensureDirectory(createRequest.localPath);
      } else {
        return res.status(400).json({
          success: false,
          error: `Invalid or inaccessible directory for the project: ${createRequest.localPath}`
        } as CreateProjectResponse);
      }
    }

    // Create project
    const result = await FileSystemService.createProject(createRequest);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in create project route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as CreateProjectResponse);
  }
});

/**
 * POST /api/projects/save
 * Save an existing project to the file system
 */
router.post('/save', async (req, res) => {
  try {
    const saveRequest: SaveProjectRequest = req.body;

    // Validate request
    if (!saveRequest.project || !saveRequest.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project and type are required'
      } as SaveProjectResponse);
    }

    // Verify ownership/path safety here if needed
    // For now, assuming if they have the path, they can save (if authenticated)

    // Validate project type
    if (saveRequest.type !== 'grafcet' && saveRequest.type !== 'gsrsm') {
      return res.status(400).json({
        success: false,
        error: 'Invalid project type. Must be "grafcet" or "gsrsm"'
      } as SaveProjectResponse);
    }

    // Save project
    const success = await FileSystemService.saveProject(saveRequest.project, saveRequest.type);

    if (success) {
      res.json({
        success: true,
        savedPath: saveRequest.project.localPath
      } as SaveProjectResponse);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save project'
      } as SaveProjectResponse);
    }
  } catch (error) {
    console.error('Error in save project route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as SaveProjectResponse);
  }
});

/**
 * POST /api/projects/load
 * Load a project from the file system
 */
router.post('/load', async (req, res) => {
  try {
    const loadRequest: LoadProjectRequest = req.body;

    // Validate request
    if (!loadRequest.projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectPath is required'
      } as LoadProjectResponse);
    }

    // Load project
    const project = await FileSystemService.loadProject(loadRequest.projectPath);

    if (project) {
      res.json({
        success: true,
        project
      } as LoadProjectResponse);
    } else {
      res.status(404).json({
        success: false,
        error: 'Project not found or invalid project structure'
      } as LoadProjectResponse);
    }
  } catch (error) {
    console.error('Error in load project route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as LoadProjectResponse);
  }
});

/**
 * GET /api/projects/list/:basePath
 * List all projects in a directory
 */
router.get('/list/*', async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    // Get the base path from the URL (everything after /list/)
    let basePath = (req.params as any)[0];

    // Decode the path
    if (basePath) basePath = decodeURIComponent(basePath);

    // If NO path provided OR we want to force user home
    if (!basePath || basePath === 'undefined' || basePath === 'null' || basePath === '/') {
      if (userId) {
        basePath = path.join(FileSystemService.getBaseStoragePath(), 'users', userId);
        await FileSystemService.ensureDirectory(basePath);
      } else {
        // Fallback
        basePath = FileSystemService.getBaseStoragePath();
      }
    } else {
      // If path provided, ensure it is within user's dir?
      // For "Pro", yes.
      if (userId) {
        const userRoot = path.join(FileSystemService.getBaseStoragePath(), 'users', userId);
        // Normalize slashes
        const normalizedUserRoot = userRoot.replace(/\\/g, '/');
        const normalizedPath = basePath.replace(/\\/g, '/');

        if (!normalizedPath.startsWith(normalizedUserRoot) && !basePath.includes(userId)) {
          // Hacky check, but if they try to access outside user dir...
          // Allow access to subdirs
          // But if they ask for root, give user root
        }
      }
    }

    // Validate path
    const isValidPath = await FileSystemService.validatePath(basePath);
    if (!isValidPath) {
      // Try creating it if it's the user root
      if (userId && basePath.includes(userId)) {
        await FileSystemService.ensureDirectory(basePath);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid or inaccessible base path'
        } as ListProjectsResponse);
      }
    }

    // List projects
    const projects = await FileSystemService.listProjects(basePath);

    // Convert to response format
    const projectList = projects.map(project => ({
      name: project.name,
      path: project.path,
      type: project.type,
      lastModified: project.lastModified || new Date().toISOString()
    }));

    res.json({
      success: true,
      projects: projectList
    } as ListProjectsResponse);
  } catch (error) {
    console.error('Error in list projects route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ListProjectsResponse);
  }
});

/**
 * POST /api/projects/validate-path
 * Validate if a path exists and is accessible
 */
router.post('/validate-path', async (req, res) => {
  try {
    const { path: folderPath } = req.body;

    if (!folderPath) {
      return res.status(400).json({
        success: false,
        error: 'Path is required'
      });
    }

    const isValid = await FileSystemService.validatePath(folderPath);

    res.json({
      success: true,
      isValid
    });
  } catch (error) {
    console.error('Error in validate path route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/projects/delete
 * Delete a project from the file system
 */
router.delete('/delete', async (req, res) => {
  try {
    const { projectPath } = req.body;

    // Validate request
    if (!projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectPath is required'
      });
    }

    // Validate path exists
    const isValidPath = await FileSystemService.validatePath(projectPath);
    if (!isValidPath) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Delete project
    const result = await FileSystemService.deleteItem(projectPath);

    if (result.success) {
      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in delete project route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
