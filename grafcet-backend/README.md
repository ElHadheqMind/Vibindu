# GRAFCET & GEMMA Editor Backend

Node.js TypeScript backend server for the GRAFCET & GEMMA Editor that provides local file system operations for project management.

## Features

- **Project Creation**: Create GRAFCET and GEMMA projects with proper folder structures
- **File System Operations**: Save and load projects to/from local file system
- **Project Management**: List, validate, and manage project files
- **Folder Browsing**: Browse local directories and drives
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Project Structure

### GRAFCET Projects
```
ProjectName/
├── project.json          # Main project metadata
├── diagrams/             # Individual diagram files
│   └── diagram-id.json   # Each diagram as separate JSON
├── exports/              # Exported files (PNG, SVG, etc.)
└── README.md            # Project documentation
```

### GEMMA Projects (Full Projects)
```
ProjectName/
├── gemma.json                    # Main GEMMA diagram
├── grafcet_de_conduite.json     # Main control GRAFCET
├── modes/                       # Individual mode folders
│   ├── A1/                      # Production modes
│   │   └── A1_grafcet.json
│   ├── A2/
│   │   └── A2_grafcet.json
│   ├── F1/                      # Failure modes
│   │   └── F1_grafcet.json
│   └── D1/                      # Shutdown modes
│       └── D1_grafcet.json
├── exports/                     # Exported files
└── README.md                   # Project documentation
```

## API Endpoints

### Project Management
- `POST /api/projects/create` - Create a new project
- `POST /api/projects/save` - Save an existing project
- `POST /api/projects/load` - Load a project from file system
- `GET /api/projects/list/*` - List projects in a directory
- `POST /api/projects/validate-path` - Validate a file path

### File System Operations
- `GET /api/files/browse/*` - Browse directories and files
- `GET /api/files/drives` - Get available drives
- `POST /api/files/create-folder` - Create a new folder
- `POST /api/files/select-folder` - Select a folder (for desktop apps)

### Health Check
- `GET /health` - Server health status

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

## Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=3002 npm run dev
```

## CORS Configuration

The server is configured to accept requests from:
- http://localhost:5173
- http://localhost:5174
- http://localhost:3000

## Development

The backend is built with:
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **fs-extra** - Enhanced file system operations
- **CORS** - Cross-origin resource sharing
- **tsx** - TypeScript execution for development

## File System Security

The backend validates all file paths and ensures:
- No access outside of selected directories
- Proper file name sanitization
- Cross-platform path compatibility
- Error handling for inaccessible paths

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Logging

The server logs all requests and errors to the console for debugging purposes.
