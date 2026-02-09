import { useProjectStore } from '../store/useProjectStore';
import { useElementsStore } from '../store/useElementsStore';
import { useEditorStore } from '../store/useEditorStore';
import { useGsrsmStore } from '../store/useGsrsmStore';
import { useGsrsmFileStore } from '../store/useGsrsmFileStore';

/**
 * Utility functions for handling state restoration after page refresh
 */

export interface AppState {
  editorType: 'grafcet' | 'gsrsm';
  showWelcome: boolean;
  currentProjectId: string | null;
  currentDiagramId: string | null;
}

const APP_STATE_KEY = 'grafcet-app-state';

/**
 * Save the current application state to localStorage
 */
export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
};

/**
 * Load the application state from localStorage
 */
export const loadAppState = (): AppState | null => {
  try {
    const stateJson = localStorage.getItem(APP_STATE_KEY);
    return stateJson ? JSON.parse(stateJson) : null;
  } catch (error) {
    console.error('Failed to load app state:', error);
    return null;
  }
};

/**
 * Clear the application state from localStorage
 */
export const clearAppStateFromStorage = (): void => {
  try {
    localStorage.removeItem(APP_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear app state:', error);
  }
};

/**
 * Restore the application state after page refresh
 * This function coordinates the restoration of all store states
 */
export const restoreApplicationState = (): {
  editorType: 'grafcet' | 'gsrsm';
  showWelcome: boolean;
} => {
  console.debug('🔄 Restoring application state...');

  // Load saved app state
  const savedAppState = loadAppState();
  console.debug('📱 Saved app state:', savedAppState);

  // Get current state from stores (which should be restored by Zustand persist)
  const projectStore = useProjectStore.getState();
  const elementsStore = useElementsStore.getState();
  const gsrsmStore = useGsrsmStore.getState();

  console.debug('🏪 Store states:', {
    currentProjectId: projectStore.currentProjectId,
    currentDiagramId: projectStore.currentDiagramId,
    projectsCount: projectStore.projects.length,
    elementsCount: elementsStore.elements.length,
    gsrsmProject: gsrsmStore.project?.name || null
  });

  // Determine editor type and welcome state
  let showWelcome = true;
  let editorType: 'grafcet' | 'gsrsm' = 'grafcet';

  // Priority 1: Use saved app state if available and valid
  if (savedAppState) {
    editorType = savedAppState.editorType;
    showWelcome = savedAppState.showWelcome;
    console.log('✅ Using saved app state:', { editorType, showWelcome });
  } else {
    // Priority 2: Determine based on persisted store state
    const hasGrafcetProject = projectStore.currentProjectId !== null;
    const hasGsrsmProject = gsrsmStore.project !== null;
    const gsrsmFileStore = useGsrsmFileStore.getState();
    const hasSingleFile = !!gsrsmFileStore.currentFilePath;

    if (hasGsrsmProject) {
      editorType = 'gsrsm';
      showWelcome = false;
      console.log('✅ Found GSRSM project, setting editor to GSRSM');
    } else if (hasGrafcetProject) {
      editorType = 'grafcet';
      showWelcome = false;
      console.log('✅ Found GRAFCET project, setting editor to GRAFCET');
    } else if (hasSingleFile) {
      // Determine editor type from file extension
      const isGsrsmFile = gsrsmFileStore.currentFilePath?.endsWith('.gsrsm');
      editorType = isGsrsmFile ? 'gsrsm' : 'grafcet';
      showWelcome = false;
      console.log('✅ Found Single File, setting editor to', editorType);
    } else {
      console.log('ℹ️ No active projects found, showing welcome screen');
    }
  }

  // Restore elements to current diagram if we have a current GRAFCET project
  if (editorType === 'grafcet' && projectStore.currentProjectId && projectStore.currentDiagramId) {
    const currentProject = projectStore.getCurrentProject();
    const currentDiagram = projectStore.getCurrentDiagram();

    if (currentProject && currentDiagram) {
      if (currentDiagram.elements && currentDiagram.elements.length > 0) {
        console.log('🔄 Loading elements from current diagram:', currentDiagram.name);
        elementsStore.loadElements(currentDiagram.elements);
      } else if (elementsStore.elements.length > 0) {
        console.log('📝 Keeping existing elements in memory (Project store elements are empty/stripped)');
        // DO NOT clear elements if the project store is empty but elementsStore has data
      }
    } else {
      console.warn('⚠️ Current project or diagram not found');
      // DO NOT clear elements here to prevent data loss on reload
      // The elementsStore's own persistence (grafcet-elements-state) is more reliable
    }
  } else if (editorType === 'grafcet') {
    // Check if we are in Single File Mode (GsrsmFileStore)
    const isSingleFileMode = !!useGsrsmFileStore.getState().currentFilePath;

    // Only clear elements if WE ARE SURE we don't need them
    if (!projectStore.currentProjectId && !isSingleFileMode && elementsStore.elements.length > 0) {
      console.debug('🧹 Elements exist but no active project/file. Keeping them as fail-safe.');
      // Still don't clear, just in case.
    }
  }

  console.debug('✅ State restoration complete:', { editorType, showWelcome });
  return { editorType, showWelcome };
};

/**
 * Update app state when user changes editor type or project
 */
export const updateAppState = (updates: Partial<AppState>): void => {
  const currentState = loadAppState() || {
    editorType: 'grafcet',
    showWelcome: true,
    currentProjectId: null,
    currentDiagramId: null,
  };

  const newState = { ...currentState, ...updates };
  saveAppState(newState);
};

/**
 * Clear app state when project is closed
 */
export const clearAppState = (): void => {
  const clearedState: AppState = {
    editorType: 'grafcet',
    showWelcome: true,
    currentProjectId: null,
    currentDiagramId: null,
  };
  saveAppState(clearedState);

  // Also trigger a custom event to notify components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('projectClosed', {
      detail: { showWelcome: true }
    }));
  }
};

/**
 * Sync app state with store changes
 * This should be called when important state changes occur
 */
export const syncAppState = (
  editorTypeOverride?: 'grafcet' | 'gsrsm',
  showWelcomeOverride?: boolean
): void => {
  const projectStore = useProjectStore.getState();
  const gsrsmStore = useGsrsmStore.getState();
  const currentState = loadAppState();

  // Determine current editor type
  let editorType: 'grafcet' | 'gsrsm' = editorTypeOverride || currentState?.editorType || 'grafcet';
  let showWelcome = showWelcomeOverride !== undefined ? showWelcomeOverride : (currentState?.showWelcome ?? true);

  // If no state exists yet, try to determine from stores
  if (!currentState && editorTypeOverride === undefined && showWelcomeOverride === undefined) {
    if (gsrsmStore.project !== null) {
      editorType = 'gsrsm';
      showWelcome = false;
    } else if (projectStore.currentProjectId !== null) {
      editorType = 'grafcet';
      showWelcome = false;
    }
  }

  console.debug('🔄 Syncing app state:', {
    editorType,
    showWelcome,
    currentProjectId: projectStore.currentProjectId,
    currentDiagramId: projectStore.currentDiagramId,
  });

  updateAppState({
    editorType,
    showWelcome,
    currentProjectId: projectStore.currentProjectId,
    currentDiagramId: projectStore.currentDiagramId,
  });
};

/**
 * Handle cleanup when user logs out
 */
export const handleLogout = (): void => {
  // Clear app state
  clearAppState();

  // Note: Store states will be cleared by their respective persist configurations
  // when the user logs out through the auth store
};

/**
 * Validate persisted state integrity
 * This function checks if the persisted state is valid and consistent
 */
export const validatePersistedState = (): boolean => {
  try {
    const projectStore = useProjectStore.getState();
    const elementsStore = useElementsStore.getState();

    // Check if current project exists
    if (projectStore.currentProjectId) {
      const currentProject = projectStore.getCurrentProject();
      if (!currentProject) {
        console.warn('Current project ID exists but project not found');
        return false;
      }

      // Check if current diagram exists
      if (projectStore.currentDiagramId) {
        const currentDiagram = projectStore.getCurrentDiagram();
        if (!currentDiagram) {
          console.warn('Current diagram ID exists but diagram not found');
          return false;
        }
      }
    }

    // Validate elements structure
    if (elementsStore.elements) {
      const isValidElements = Array.isArray(elementsStore.elements) &&
        elementsStore.elements.every(element =>
          element && typeof element === 'object' &&
          element.id && element.type && element.position
        );

      if (!isValidElements) {
        console.warn('Invalid elements structure in persisted state');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating persisted state:', error);
    return false;
  }
};

/**
 * Reset invalid state
 * This function resets the application state if validation fails
 */
export const resetInvalidState = (): void => {
  console.warn('Resetting invalid persisted state');

  // Clear localStorage for all stores
  const storeKeys = [
    'grafcet-editor-state',
    'grafcet-elements-state',
    'grafcet-project-state',
    'grafcet-Gsrsm-state',
    'grafcet-history-state',
    APP_STATE_KEY
  ];

  storeKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
    }
  });

  // Reload the page to start fresh
  window.location.reload();
};

/**
 * Reset all application state to default values
 * This function completely resets the application to its initial state
 */
export const resetToDefaultState = (): void => {
  console.log('Resetting application to default state');

  try {
    // Clear all localStorage data
    const allStoreKeys = [
      'grafcet-editor-state',
      'grafcet-elements-state',
      'grafcet-project-state',
      'grafcet-Gsrsm-state',
      'grafcet-history-state',
      'grafcet-auth-state',
      'grafcet-theme-state',
      'grafcet-popup-state',
      APP_STATE_KEY,
      // Additional keys that might exist
      'grafcet-editor-projects',
      'grafcet-editor-current-project',
      'grafcet-editor-current-diagram'
    ];

    allStoreKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to clear ${key}:`, error);
      }
    });

    // Reset all Zustand stores to their initial state
    try {
      // Reset project store
      useProjectStore.getState().closeProject();
      useProjectStore.setState({
        projects: [],
        currentProjectId: null,
        currentDiagramId: null,
      });

      // Reset elements store
      useElementsStore.getState().clearElements();
      useElementsStore.setState({
        elements: [],
        selectedElementIds: [],
      });

      // Reset editor store
      useEditorStore.setState({
        currentTool: 'select',
        snapToGrid: true,
        gridSize: 20,
        scale: 1,
        offset: { x: 0, y: 0 },
        editorMode: 'guided',
      });

      // Reset GSRSM store
      useGsrsmStore.getState().closeProject();
      useGsrsmStore.setState({
        project: null,
        selectedModeIds: [],
        scale: 1,
        offset: { x: 0, y: 0 },
        contextMenuPosition: null,
        contextMenuOptions: [],
      });

    } catch (error) {
      console.error('Error resetting store states:', error);
    }

    // Set default app state
    const defaultAppState: AppState = {
      editorType: 'grafcet',
      showWelcome: true,
      currentProjectId: null,
      currentDiagramId: null,
    };
    saveAppState(defaultAppState);

    console.log('Application state reset to default successfully');

    // Reload the page to ensure clean state
    window.location.reload();

  } catch (error) {
    console.error('Error during state reset:', error);
    // Force reload as fallback
    window.location.reload();
  }
};

/**
 * Debug function to check current state
 */
export const debugCurrentState = (): void => {
  console.log('🔍 === CURRENT APPLICATION STATE DEBUG ===');

  // App state from localStorage
  const appState = loadAppState();
  console.log('📱 App State (localStorage):', appState);

  // Store states
  const projectStore = useProjectStore.getState();
  const elementsStore = useElementsStore.getState();
  const gsrsmStore = useGsrsmStore.getState();

  console.log('🏪 Project Store:', {
    projectsCount: projectStore.projects.length,
    currentProjectId: projectStore.currentProjectId,
    currentDiagramId: projectStore.currentDiagramId,
    projects: projectStore.projects.map(p => ({ id: p.id, name: p.name, diagramsCount: p.diagrams.length }))
  });

  console.log('🧩 Elements Store:', {
    elementsCount: elementsStore.elements.length,
    selectedCount: elementsStore.selectedElementIds.length
  });

  console.log('💎 GSRSM Store:', {
    hasProject: !!gsrsmStore.project,
    projectName: gsrsmStore.project?.name || null
  });

  // localStorage keys
  const localStorageKeys = [
    'grafcet-app-state',
    'grafcet-project-state',
    'grafcet-editor-projects',
    'grafcet-editor-current-project',
    'grafcet-editor-current-diagram'
  ];

  console.log('💾 localStorage Contents:');
  localStorageKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`  ${key}:`, value ? JSON.parse(value) : null);
    } catch (error) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  });

  console.log('🔍 === END DEBUG ===');
};

/**
 * Test persistence functionality
 */
export const testPersistence = (): void => {
  console.log('🧪 Testing persistence functionality...');

  try {
    // Test localStorage access
    const testKey = 'grafcet-persistence-test';
    const testValue = { test: true, timestamp: Date.now() };

    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = JSON.parse(localStorage.getItem(testKey) || '{}');

    if (retrieved.test === true) {
      console.log('✅ localStorage is working correctly');
      localStorage.removeItem(testKey);
    } else {
      console.error('❌ localStorage test failed');
      return;
    }

    // Test store persistence
    const projectStore = useProjectStore.getState();
    const elementsStore = useElementsStore.getState();
    const gsrsmStore = useGsrsmStore.getState();

    console.log('📊 Current store states:');
    console.log('  Project Store:', {
      projects: projectStore.projects.length,
      currentProjectId: projectStore.currentProjectId,
      currentDiagramId: projectStore.currentDiagramId
    });
    console.log('  Elements Store:', {
      elements: elementsStore.elements.length,
      selectedElements: elementsStore.selectedElementIds.length
    });
    console.log('  GSRSM Store:', {
      hasProject: !!gsrsmStore.project,
      projectName: gsrsmStore.project?.name || null
    });

    console.log('✅ Persistence test completed successfully');

  } catch (error) {
    console.error('❌ Persistence test failed:', error);
  }
};

/**
 * Expose utility functions to global window for console access
 * This allows users to debug and reset the app from browser console
 */
if (typeof window !== 'undefined') {
  (window as any).resetGrafcetApp = () => {
    console.log('🔄 Resetting GRAFCET & GSRSM Editor to default state...');
    resetToDefaultState();
  };

  (window as any).clearGrafcetStorage = () => {
    console.log('🗑️ Clearing all GRAFCET & GSRSM Editor storage...');
    const allStoreKeys = [
      'grafcet-editor-state',
      'grafcet-elements-state',
      'grafcet-project-state',
      'grafcet-Gsrsm-state',
      'grafcet-history-state',
      'grafcet-auth-state',
      'grafcet-theme-state',
      'grafcet-popup-state',
      'grafcet-app-state',
      'grafcet-editor-projects',
      'grafcet-editor-current-project',
      'grafcet-editor-current-diagram'
    ];

    allStoreKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to clear ${key}:`, error);
      }
    });

    console.log('🔄 Please refresh the page to complete the reset.');
  };

  (window as any).debugGrafcetState = () => {
    debugCurrentState();
  };

  (window as any).testGrafcetPersistence = () => {
    testPersistence();
  };
}
