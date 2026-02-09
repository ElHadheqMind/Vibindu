import path from 'path';
import { getStorageService } from './storageService.js';
import { FileSystemService } from './fileSystemService.js';

export class NavigateService {
    private static storage = getStorageService();

    /**
     * Resolves the navigation path and generates a frontend-compatible URL.
     */
    static async resolveNavigationPath(
        projectPath: string,
        modeId?: string,
        fileName?: string
    ): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
        try {
            console.log(`[NavigateService] Resolving path for Project: ${projectPath}, Mode: ${modeId}, File: ${fileName}`);

            // 1. Validate Project Path
            if (!await FileSystemService.validatePath(projectPath)) {
                return { success: false, error: `Project path not found: ${projectPath}` };
            }

            let targetPath = projectPath;

            // 2. Resolve Mode Folder
            const cleanModeId = modeId?.trim();
            if (cleanModeId) {
                // Check for 'modes' folder
                const modesPath = path.join(projectPath, 'modes');
                const modePath = path.join(modesPath, cleanModeId);

                if (await FileSystemService.validatePath(modePath)) {
                    targetPath = modePath;
                } else {
                    // Try to find by code if modeId is not found directly? 
                    // Toolkit.py does some matching, but here we expect accurate ID or Code. 
                    // Let's assume modeId is the folder name for now.
                    // If it doesn't exist, we might fail or default to project root?
                    // User said "if exsit and navigate". So if not exist, fail.
                    return { success: false, error: `Mode folder not found: ${modeId}` };
                }
            }

            // 3. Resolve File
            // Defaults to check if fileName is not provided
            const defaultFiles = ['conduct.sfc', 'main.gsrsm', 'default.sfc', 'main.grafcet'];
            let finalFilePath = '';

            if (fileName) {
                const potentialPath = path.join(targetPath, fileName);
                // Handle extensions if missing?
                // Assuming strict for now or simple check
                if (await FileSystemService.validatePath(potentialPath)) {
                    finalFilePath = potentialPath;
                } else if (await FileSystemService.validatePath(potentialPath + '.sfc')) {
                    finalFilePath = potentialPath + '.sfc';
                } else if (await FileSystemService.validatePath(potentialPath + '.gsrsm')) {
                    finalFilePath = potentialPath + '.gsrsm';
                } else {
                    return { success: false, error: `File not found: ${fileName} in ${targetPath}` };
                }
            } else {
                // Try defaults
                for (const f of defaultFiles) {
                    const p = path.join(targetPath, f);
                    if (await FileSystemService.validatePath(p)) {
                        finalFilePath = p;
                        break;
                    }
                }
                if (!finalFilePath) {
                    // If no default file found, maybe just point to the folder?
                    // Frontend usually expects ?file=... 
                    // If we can't find a file, we can't navigate to a specific file.
                    return { success: false, error: `No default file found in ${targetPath}` };
                }
            }

            // 4. Generate URL
            // The frontend (MainApp.tsx) resolves paths relative to the User's Home (drive path).
            // StorageService returns paths relative to Storage Root (e.g. "users/userId/Project/file").
            // To be compatible with the app's "same way", we must strip the "users/userId/" prefix.

            let relativePathForUrl = '';
            try {
                // Get path relative to Storage Root (e.g. "users/123/Proj/file.sfc")
                const storageRelPath = this.storage.getRelativePath(finalFilePath);

                // Convert to forward slashes
                const normalizedRel = storageRelPath.replace(/\\/g, '/');

                // Check if it starts with users/something/
                // If so, strip it to get the path relative to the User Home
                const userPathMatch = normalizedRel.match(/^users\/[^/]+\/(.*)$/);
                if (userPathMatch) {
                    relativePathForUrl = userPathMatch[1];
                } else {
                    // Fallback: use the storage relative path (e.g. if not in users folder)
                    relativePathForUrl = normalizedRel;
                }
            } catch (e) {
                // If it fails (e.g. outside storage), leave empty or try absolute (but user wanted "app way")
                // ideally this shouldn't happen for valid project files.
                relativePathForUrl = finalFilePath.replace(/\\/g, '/');
            }

            const encodedFile = encodeURIComponent(relativePathForUrl).replace(/%2F/g, '/');
            const url = `http://localhost:3000/${encodedFile}`;

            console.log(`[NavigateService] Resolved to URL: ${url}`);

            return {
                success: true,
                url,
                path: finalFilePath.replace(/\\/g, '/')
            };

        } catch (error) {
            console.error('[NavigateService] Error:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
