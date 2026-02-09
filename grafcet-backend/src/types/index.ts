// Project types
export interface GrafcetElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  [key: string]: any;
}

export interface GrafcetDiagram {
  id: string;
  name: string;
  elements: GrafcetElement[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrafcetProject {
  id: string;
  name: string;
  diagrams: GrafcetDiagram[];
  simulation?: {
    variables: any[];
    actions: any[];
  };
  createdAt: string;
  updatedAt: string;
  localPath?: string; // Path where the project is saved locally
}

export interface GsrsmMode {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  type: string;
  selected: boolean;
}

export interface GsrsmDiagram {
  id: string;
  name: string;
  modes: GsrsmMode[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface GsrsmProject {
  id: string;
  name: string;
  diagram: GsrsmDiagram;
  createdAt: string;
  updatedAt: string;
  localPath?: string; // Path where the project is saved locally
}

// API Request/Response types
export interface CreateProjectRequest {
  name: string;
  type: 'grafcet' | 'gsrsm';
  localPath: string; // Where to save the project
}

export interface CreateProjectResponse {
  success: boolean;
  project?: GrafcetProject | GsrsmProject;
  error?: string;
  projectPath?: string;
}

export interface SaveProjectRequest {
  project: GrafcetProject | GsrsmProject;
  type: 'grafcet' | 'gsrsm';
}

export interface SaveProjectResponse {
  success: boolean;
  error?: string;
  savedPath?: string;
}

export interface LoadProjectRequest {
  projectPath: string;
}

export interface LoadProjectResponse {
  success: boolean;
  project?: GrafcetProject | GsrsmProject;
  error?: string;
}

export interface ListProjectsResponse {
  success: boolean;
  projects?: Array<{
    name: string;
    path: string;
    type: 'grafcet' | 'gsrsm';
    lastModified: string;
  }>;
  error?: string;
}

export interface SelectFolderResponse {
  success: boolean;
  folderPath?: string;
  error?: string;
}

// File system operation types
export interface ProjectStructure {
  type: 'grafcet' | 'gsrsm';
  name: string;
  path: string;
  files: string[];
  folders?: string[];
  lastModified?: string;
}

// File creation types
export type FileType = 'grafcet' | 'gsrsm' | 'folder' | 'custom';

export interface CreateFileRequest {
  parentPath: string;
  fileName: string;
  fileType: FileType;
  customExtension?: string; // For custom file types
}

export interface CreateFileResponse {
  success: boolean;
  filePath?: string;
  fileData?: object; // The created file content for grafcet/gsrsm
  error?: string;
}

export interface CreateModeGrafcetRequest {
  projectPath: string;
  modeCode: string;
}

export interface CreateModeGrafcetResponse {
  success: boolean;
  filePath?: string;
  grafcet?: GrafcetDiagram;
  error?: string;
}
