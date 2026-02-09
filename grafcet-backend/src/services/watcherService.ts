import chokidar, { FSWatcher } from 'chokidar';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

export class WatcherService {
    private watcher: FSWatcher | null = null;
    private io: SocketIOServer;
    private watchPath: string;

    constructor(io: SocketIOServer, watchPath: string) {
        this.io = io;
        this.watchPath = watchPath;
        this.initialize();
    }

    private initialize() {
        console.log(`👀 Initializing file watcher for: ${this.watchPath}`);

        this.watcher = chokidar.watch(this.watchPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true, // Don't emit add events for existing files on startup
            depth: 10
        });

        this.watcher
            .on('add', (filePath: string) => this.emitEvent('file:created', filePath))
            .on('change', (filePath: string) => this.emitEvent('file:changed', filePath))
            .on('unlink', (filePath: string) => this.emitEvent('file:deleted', filePath))
            .on('addDir', (dirPath: string) => this.emitEvent('dir:created', dirPath))
            .on('unlinkDir', (dirPath: string) => this.emitEvent('dir:deleted', dirPath))
            .on('error', (error: Error) => console.error(`Watcher error: ${error}`));

        console.log('✅ File watcher started');
    }

    private emitEvent(event: string, fullPath: string) {
        // Convert absolute path to relative path from watch root
        // This ensures the frontend gets paths it can use/match
        const relativePath = path.relative(this.watchPath, fullPath);

        // Normalize windows paths to forward slashes
        const normalizedPath = relativePath.replace(/\\/g, '/');

        console.log(`📡 Emitting ${event}: ${normalizedPath}`);
        this.io.emit(event, {
            path: normalizedPath,
            fullPath,
            timestamp: new Date().toISOString()
        });
    }

    public stop() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }
    }
}
