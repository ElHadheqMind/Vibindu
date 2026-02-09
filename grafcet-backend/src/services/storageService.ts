import { Disk } from 'flydrive';
import { getStorageDisk, getBaseStoragePath, getStorageDriver } from '../config/storage.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * StorageService - A wrapper around Flydrive for file operations
 * This service abstracts all file system operations and makes it easy to switch storage providers
 */
export class StorageService {
    private disk: Disk;
    private basePath: string;

    constructor() {
        this.disk = getStorageDisk();
        this.basePath = getBaseStoragePath();
        console.log('[StorageService] Initialized with basePath:', this.basePath);
    }

    /**
     * Resolves a path for Flydrive
     * Ensures we always work with relative paths relative to the storage root
     */
    public resolvePath(filePath: string): string {
        if (!filePath || filePath === 'undefined' || filePath === 'null') {
            throw new Error('E_INVALID_PATH: Path is null, undefined or "undefined" string');
        }

        // If it's already a relative path, ensure it's clean and has no leading slash
        if (!path.isAbsolute(filePath)) {
            const sanitized = filePath.replace(/\\/g, '/').replace(/^\//, '');
            // Prevent traversal even in relative paths passed from outside
            if (sanitized.startsWith('..') || sanitized.includes('/../')) {
                throw new Error('E_PATH_TRAVERSAL_DETECTED');
            }
            return sanitized;
        }

        // If it's absolute, try to make it relative to base path
        return this.getRelativePath(filePath);
    }

    /**
     * Write a JSON file to storage
     */
    async writeJson(filePath: string, data: any): Promise<void> {
        const content = JSON.stringify(data, null, 2);
        const resolvedPath = this.resolvePath(filePath);
        await this.disk.put(resolvedPath, content);
    }

    /**
     * Read a JSON file from storage
     */
    async readJson<T = any>(filePath: string): Promise<T> {
        const resolvedPath = this.resolvePath(filePath);
        const content = await this.disk.get(resolvedPath);
        return JSON.parse(content.toString());
    }

    /**
     * Write a text file to storage
     */
    async writeFile(filePath: string, content: string | Buffer): Promise<void> {
        const resolvedPath = this.resolvePath(filePath);
        await this.disk.put(resolvedPath, content);
    }

    /**
     * Write binary data to storage
     */
    async writeBinary(filePath: string, data: Buffer): Promise<void> {
        const resolvedPath = this.resolvePath(filePath);
        await this.disk.put(resolvedPath, data);
    }

    /**
     * Read a text file from storage
     */
    async readFile(filePath: string): Promise<string> {
        const resolvedPath = this.resolvePath(filePath);
        const content = await this.disk.get(resolvedPath);
        return content.toString();
    }

    /**
     * Check if a file or directory exists
     */
    async exists(filePath: string): Promise<boolean> {
        // Root path always exists
        if (filePath === '' || filePath === '.') return true;

        // Flydrive's Local driver disk.exists() often only works for files.
        // For directories, we need a different approach.
        try {
            const resolvedPath = this.resolvePath(filePath);
            const result = await this.disk.exists(resolvedPath);
            if (result) return true;

            // If false, it might still be a directory.
            // For Local driver, we can use the driver's info or fallback to a shallow list
            if (getStorageDriver() === 'local') {
                const absolute = this.getAbsolutePath(resolvedPath);
                return fs.existsSync(absolute);
            }

            // For cloud drivers, "directories" often don't exist unless they have children.
            // We can try to list one item.
            const list = this.disk.listAll(resolvedPath);
            // @ts-ignore
            for await (const obj of list) {
                return true; // Found at least one item inside, so it "exists" as a prefix
            }

            return false;
        } catch (error) {
            console.error(`[StorageService] exists error for "${filePath}":`, error);
            return false;
        }
    }

    /**
     * Delete a file or directory
     */
    async delete(filePath: string): Promise<void> {
        const resolvedPath = this.resolvePath(filePath);
        await this.disk.delete(resolvedPath);
    }

    /**
     * Delete a file or directory and all its contents
     */
    async deleteDirectory(directoryPath: string): Promise<void> {
        try {
            const resolvedPath = this.resolvePath(directoryPath);

            // Safety check: Don't allow deleting the root directory or very short paths
            if (resolvedPath === '' || resolvedPath === '.' || resolvedPath === '/') {
                throw new Error('E_SECURITY_VIOLATION: Cannot delete root storage directory');
            }

            const absolute = this.getAbsolutePath(resolvedPath);

            // For local driver, we can use fs.rmSync for efficient recursive deletion
            if (getStorageDriver() === 'local') {
                if (fs.existsSync(absolute)) {
                    // fs.rmSync is available in Node.js 14.14.0+
                    if (typeof fs.rmSync === 'function') {
                        fs.rmSync(absolute, { recursive: true, force: true });
                    } else {
                        // Fallback for older Node versions
                        const stats = fs.statSync(absolute);
                        if (stats.isDirectory()) {
                            // Recursively remove directory
                            fs.rmdirSync(absolute, { recursive: true });
                        } else {
                            fs.unlinkSync(absolute);
                        }
                    }
                }
                return;
            }

            // For Cloud Drivers (GCS, S3, etc.)
            // First check if it's a file
            try {
                const isFile = await this.disk.exists(resolvedPath);
                if (isFile) {
                    await this.disk.delete(resolvedPath);
                    // On cloud storage, deleting a "file" might be enough if it's not a folder prefix
                }
            } catch (e) {
                // If it's not a single file, it might be a directory/prefix
            }

            // Delete everything with this prefix (recursive)
            // @ts-ignore - disk.listAll is available in Flydrive V3
            const list = this.disk.listAll(resolvedPath);
            // @ts-ignore
            for await (const obj of list) {
                const itemPath = obj.path || obj.key || obj.prefix;
                if (itemPath) {
                    await this.disk.delete(itemPath);
                }
            }
        } catch (error) {
            console.error(`[StorageService] Error deleting "${directoryPath}":`, error);
            throw error;
        }
    }

    /**
     * List files in a directory
     */
    async listDirectory(directoryPath: string, recursive: boolean = false): Promise<Array<{ name: string; path: string; isDirectory: boolean; size?: number }>> {
        try {
            const resolvedPath = this.resolvePath(directoryPath);

            // For Local driver, we use fs.readdirSync directly as Flydrive's listAll
            // can be inconsistent with local subdirectories in some environments.
            if (getStorageDriver() === 'local') {
                const absolute = this.getAbsolutePath(resolvedPath);

                // Ensure the directory exists and is actually a directory
                if (!fs.existsSync(absolute)) {
                    return [];
                }

                const stats = fs.statSync(absolute);
                if (!stats.isDirectory()) {
                    return []; // Or handle as looking for a single file if needed
                }

                if (recursive) {
                    // Helper for recursive readdir
                    const getAllFiles = (dir: string, baseDir: string, allFiles: any[] = []) => {
                        const files = fs.readdirSync(dir, { withFileTypes: true });
                        for (const file of files) {
                            const fullPath = path.join(dir, file.name);
                            const relativeToStorageRoot = path.relative(this.basePath, fullPath).replace(/\\/g, '/');

                            allFiles.push({
                                name: file.name,
                                path: relativeToStorageRoot,
                                isDirectory: file.isDirectory(),
                                size: file.isFile() ? fs.statSync(fullPath).size : 0
                            });

                            if (file.isDirectory()) {
                                getAllFiles(fullPath, baseDir, allFiles);
                            }
                        }
                        return allFiles;
                    };

                    return getAllFiles(absolute, absolute);
                } else {
                    const files = fs.readdirSync(absolute, { withFileTypes: true });

                    return files.map(file => {
                        const relativeItemPath = path.join(resolvedPath, file.name).replace(/\\/g, '/');
                        const absoluteItemPath = path.join(absolute, file.name);

                        return {
                            name: file.name,
                            path: relativeItemPath,
                            isDirectory: file.isDirectory(),
                            size: file.isFile() ? fs.statSync(absoluteItemPath).size : 0
                        };
                    });
                }
            }

            // @ts-ignore
            const result = recursive ? this.disk.listAll(resolvedPath) : this.disk.list(resolvedPath);
            const objects = [];

            // Flydrive V3 disk.listAll() returns an AsyncIterable
            // @ts-ignore
            for await (const obj of result) {
                objects.push(obj);
            }

            return objects.map((obj: any) => {
                const isDir = obj.isDirectory || obj.type === 'directory';
                return {
                    name: obj.name || path.basename(obj.path),
                    path: obj.path || obj.key || obj.prefix,
                    isDirectory: isDir,
                    size: obj.size || obj.contentLength
                };
            });
        } catch (error) {
            console.error('[StorageService] Error listing directory:', error);
            return [];
        }
    }

    /**
     * Create a directory (ensuring parent directories exist)
     */
    async ensureDirectory(directoryPath: string): Promise<void> {
        const resolvedPath = this.resolvePath(directoryPath);
        // In Flydrive, directories are created implicitly when files are written
        // We'll create a .keep file to ensure the directory exists
        const keepFilePath = path.join(resolvedPath, '.keep').replace(/\\/g, '/');
        await this.disk.put(keepFilePath, '');
    }

    /**
     * Copy a file or directory
     */
    async copyItem(sourcePath: string, destPath: string): Promise<void> {
        const resolvedSource = this.resolvePath(sourcePath);
        const resolvedDest = this.resolvePath(destPath);

        const isDir = (await this.getMetadata(resolvedSource)) === null;

        if (isDir) {
            const items = await this.listDirectory(resolvedSource);
            await this.ensureDirectory(resolvedDest);
            for (const item of items) {
                // Determine relative path from source root
                // For simplified copy, we iterate.
                // Note: listDirectory returns full paths relative to root usually. 
                // We need to be careful with recursion.
                // Assuming flat list or similar, but verify recursion.

                // If it is recursive listAll:
                const relativeSubPath = item.path.startsWith(resolvedSource)
                    ? item.path.substring(resolvedSource.length).replace(/^\//, '')
                    : item.name;

                await this.copyItem(
                    item.path,
                    path.join(resolvedDest, relativeSubPath).replace(/\\/g, '/')
                );
            }
        } else {
            const content = await this.disk.get(resolvedSource);
            await this.disk.put(resolvedDest, content);
        }
    }

    /**
     * Move a file or directory
     */
    async moveItem(sourcePath: string, destPath: string): Promise<void> {
        // Copy then delete is the safest generic way across drivers
        await this.copyItem(sourcePath, destPath);

        const resolvedSource = this.resolvePath(sourcePath);
        const isDir = (await this.getMetadata(resolvedSource)) === null;

        if (isDir) {
            await this.deleteDirectory(sourcePath);
        } else {
            await this.delete(sourcePath);
        }
    }

    /**
     * Get the absolute local path (for local storage driver)
     * This is useful for operations that require direct file system access
     * WARN: Use sparingly and primarily for display or legacy compatibility
     */
    getAbsolutePath(relativePath: string): string {
        return path.join(this.basePath, relativePath).replace(/\\/g, '/');
    }

    /**
     * Convert an absolute path to a relative storage path
     */
    getRelativePath(absolutePath: string): string {
        if (!absolutePath || absolutePath === 'undefined' || absolutePath === 'null') {
            throw new Error('E_INVALID_PATH: Absolute path is null or undefined string');
        }

        // Normalize both paths to use forward slashes and consistent case for the drive letter
        const normalize = (p: string) => {
            let normalized = p.replace(/\\/g, '/');
            // On Windows, handle drive letter case specifically
            if (process.platform === 'win32' && normalized.match(/^[a-zA-Z]:/)) {
                normalized = normalized[0].toUpperCase() + normalized.slice(1);
            }
            return normalized;
        };
        const normalizedBase = normalize(this.basePath);
        const normalizedTarget = normalize(absolutePath);

        // If it's already relative, just return it sanitized
        if (!path.isAbsolute(absolutePath)) {
            return normalizedTarget;
        }

        // Use Node's path.relative to handle cross-platform logic
        const relative = path.relative(normalizedBase, normalizedTarget);
        console.log(`[StorageService] getRelativePath: Base="${normalizedBase}", Target="${normalizedTarget}", Result="${relative}"`);

        // If the relative path starts with .. it means it's outside the base path
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            console.warn(`[StorageService] Attempted to access path outside base storage: ${absolutePath}`);
            console.warn(`[StorageService] Base: ${normalizedBase}, Target: ${normalizedTarget}, Relative: ${relative}`);
            throw new Error('E_PATH_TRAVERSAL_DETECTED');
        }

        // Convert to forward slashes for Flydrive
        return relative.replace(/\\/g, '/');
    }

    /**
     * Validate if a path is accessible
     */
    async validatePath(pathOrRelative: string): Promise<boolean> {
        try {
            return await this.exists(pathOrRelative);
        } catch {
            return false;
        }
    }

    /**
     * Sanitize a file name for cross-platform compatibility
     */
    sanitizeFileName(name: string): string {
        return name
            .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .replace(/_{2,}/g, '_') // Replace multiple underscores with single
            .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    }

    /**
     * Generate a unique file ID
     */
    generateId(): string {
        return uuidv4();
    }

    /**
     * Get metadata about a file
     */
    async getMetadata(filePath: string): Promise<{ size: number; lastModified: Date } | null> {
        try {
            const resolvedPath = this.resolvePath(filePath);
            const stats = await this.disk.getMetaData(resolvedPath);
            return {
                size: stats.contentLength,
                lastModified: stats.lastModified
            };
        } catch {
            return null;
        }
    }

    /**
     * Get the base storage path
     */
    getBasePath(): string {
        return this.basePath;
    }
}

// Singleton instance
let storageServiceInstance: StorageService | null = null;

/**
 * Get the storage service instance (singleton)
 */
export const getStorageService = (): StorageService => {
    if (!storageServiceInstance) {
        storageServiceInstance = new StorageService();
    }
    return storageServiceInstance;
};

export default StorageService;
