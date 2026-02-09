# Flydrive Storage Integration

This project uses **Flydrive** for file storage management, which provides a unified API for different storage providers. This makes it easy to switch between local file system, Google Drive, Amazon S3, and other storage providers without changing your application code.

## Current Configuration

The system is currently configured to use **local file storage**. Files are stored in:

- Default location: `Documents/GrafcetProjects` in your user's home directory
- Custom location: Set via `STORAGE_PATH` environment variable

## Architecture

### Components

1. **Storage Configuration** (`src/config/storage.ts`)
   - Configures and initializes the Flydrive disk
   - Manages storage driver selection
   - Provides singleton instance of storage disk

2. **Storage Service** (`src/services/storageService.ts`)
   - Wrapper around Flydrive with application-specific methods
   - Provides abstracted file operations (read, write, delete, etc.)
   - Handles path conversions between absolute and relative paths

3. **File System Service** (`src/services/fileSystemService.ts`)
   - Business logic for GRAFCET and GEMMA projects
   - Uses StorageService for all file operations
   - Project creation, loading, and management

4. **File Routes** (`src/routes/fileRoutes.ts`)
   - API endpoints for file operations
   - Uses both StorageService and FileSystemService

## Environment Variables

Configure storage in your `.env` file:

```bash
# Storage driver: 'local' (currently supported), 'google-drive' (coming soon)
STORAGE_DRIVER=local

# Custom local storage path (optional)
STORAGE_PATH=C:\Users\YourName\Documents\GrafcetProjects
```

## Switching to Google Drive (Future)

To switch to Google Drive storage, you'll need to:

### 1. Install Google Drive Driver

```bash
npm install @flydrive/gcs
```

### 2. Update Environment Variables

```bash
STORAGE_DRIVER=google-drive
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3001/auth/google/callback
GOOGLE_DRIVE_FOLDER_ID=root
```

### 3. Implement Google Drive Driver in `src/config/storage.ts`

Add the Google Drive case in `createStorageDisk()`:

```typescript
import { GCSDriver } from '@flydrive/gcs';

// In createStorageDisk function
case 'google-drive':
  return createGoogleDriveDisk();

// Add new function
const createGoogleDriveDisk = (): Disk => {
  const gcsDriver = new GCSDriver({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY!,
    },
    bucket: process.env.GOOGLE_DRIVE_BUCKET!,
    visibility: 'private' as const,
  });

  return new Disk(gcsDriver);
};
```

### 4. Add OAuth Authentication

Create authentication routes for Google OAuth:

```typescript
// src/routes/authRoutes.ts
router.get('/auth/google', (req, res) => {
  // Redirect to Google OAuth
});

router.get('/auth/google/callback', (req, res) => {
  // Handle OAuth callback
  // Store credentials
});
```

## API Usage

The API remains the same regardless of storage provider:

### Create Project

```http
POST /api/projects/create
Content-Type: application/json

{
  "name": "My Project",
  "type": "gemma",
  "localPath": "/path/to/parent"
}
```

### Load Project

```http
POST /api/projects/load
Content-Type: application/json

{
  "projectPath": "/path/to/project"
}
```

### Create File

```http
POST /api/files/create-file
Content-Type: application/json

{
  "parentPath": "/path/to/parent",
  "fileName": "diagram1",
  "fileType": "grafcet"
}
```

## Storage Service Methods

The `StorageService` provides these key methods:

- `writeJson(path, data)` - Write JSON file
- `readJson(path)` - Read JSON file
- `writeFile(path, content)` - Write text file
- `readFile(path)` - Read text file
- `exists(path)` - Check if file/directory exists
- `delete(path)` - Delete file
- `deleteDirectory(path)` - Delete directory recursively
- `listDirectory(path)` - List directory contents
- `ensureDirectory(path)` - Create directory
- `copy(source, dest)` - Copy file
- `move(source, dest)` - Move file
- `getMetadata(path)` - Get file metadata

## Path Handling

The system uses two path types:

1. **Absolute paths** - Full file system paths (e.g., `C:\Users\...\project`)
   - Used in API responses
   - Used for UI display
   - Converted via `storage.getAbsolutePath(relativePath)`

2. **Relative paths** - Paths relative to storage root
   - Used internally by Flydrive
   - Storage-agnostic
   - Converted via `storage.getRelativePath(absolutePath)`

## Benefits of Flydrive

✅ **Unified API** - Same code works with different storage providers
✅ **Easy Migration** - Switch storage providers with configuration change
✅ **Testable** - Mock storage easily for testing
✅ **Cloud-Ready** - Built-in support for cloud storage providers
✅ **Type-Safe** - Full TypeScript support

## Development

### Testing Local Storage

1. Start the backend:
   ```bash
   npm run dev
   ```

2. Projects will be saved to your configured storage path

3. Check the directory to see created projects

### Future Enhancements

- [ ] Google Drive integration
- [ ] Amazon S3 support
- [ ] Dropbox support
- [ ] OneDrive support
- [ ] Storage usage analytics
- [ ] File versioning
- [ ] Sharing and collaboration features

## Troubleshoads

### Issue: Files not being created

- Check `STORAGE_PATH` in your `.env` file
- Verify the directory exists and has write permissions
- Check backend logs for errors

### Issue: Cannot read files

- Verify files exist in the storage path
- Check file permissions
- Ensure correct path format in API requests

## License

Same as parent project (MIT)
