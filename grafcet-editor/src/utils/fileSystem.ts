import JSZip from 'jszip';
import { GrafcetProject, GrafcetDiagram } from '../models/types';

// Local storage keys - REMOVED
// We do not use local storage anymore. All data is persisted via Flydrive (backend).

export interface RecentFile {
  name: string;
  path: string;
  type: 'grafcet' | 'gsrsm' | 'file';
  lastOpened: string;
}

// Recent files are now managed via backend or session (to be implemented if needed)
// For now, these functions are removed to enforce "no local storage" rule.


// Export project to JSON file
export const exportProjectToJson = (project: GrafcetProject): void => {
  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name}.grafcet.json`;
  a.click();

  URL.revokeObjectURL(url);
};

// Export diagram to JSON file
export const exportDiagramToJson = (diagram: GrafcetDiagram): void => {
  const jsonString = JSON.stringify(diagram, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${diagram.name}.grafcet.json`;
  a.click();

  URL.revokeObjectURL(url);
};

// Export project to ZIP file
export const exportProjectToZip = async (project: GrafcetProject): Promise<void> => {
  const zip = new JSZip();

  // Add project metadata
  const projectMetadata = { ...project, diagrams: project.diagrams.map(d => d.id) };
  zip.file('project.json', JSON.stringify(projectMetadata, null, 2));

  // Add diagrams
  const diagramsFolder = zip.folder('diagrams');
  if (diagramsFolder) {
    project.diagrams.forEach((diagram) => {
      diagramsFolder.file(`${diagram.id}.json`, JSON.stringify(diagram, null, 2));
    });
  }

  // Generate ZIP file
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name}.grafcet.zip`;
  a.click();

  URL.revokeObjectURL(url);
};

// Import project from JSON file
export const importProjectFromJson = (file: File): Promise<GrafcetProject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const project = JSON.parse(jsonString) as GrafcetProject;
        resolve(project);
      } catch (error) {
        reject(new Error('Invalid project file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

// Import project from ZIP file
export const importProjectFromZip = (file: File): Promise<GrafcetProject> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const zipData = event.target?.result;
        if (!zipData) {
          reject(new Error('Failed to read ZIP file'));
          return;
        }

        const zip = await JSZip.loadAsync(zipData);

        // Read project metadata
        const projectFile = zip.file('project.json');
        if (!projectFile) {
          reject(new Error('Invalid project ZIP: missing project.json'));
          return;
        }

        const projectJson = await projectFile.async('string');
        const projectMetadata = JSON.parse(projectJson);

        // Read diagrams
        const diagrams: GrafcetDiagram[] = [];
        const diagramsFolder = zip.folder('diagrams');

        if (diagramsFolder) {
          const diagramFiles = Object.values(diagramsFolder.files).filter(
            (file) => !file.dir && file.name.endsWith('.json')
          );

          for (const file of diagramFiles) {
            const diagramJson = await file.async('string');
            const diagram = JSON.parse(diagramJson) as GrafcetDiagram;
            diagrams.push(diagram);
          }
        }

        // Reconstruct project
        const project: GrafcetProject = {
          ...projectMetadata,
          diagrams,
        };

        resolve(project);
      } catch (error) {
        reject(new Error('Failed to import project from ZIP'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};
