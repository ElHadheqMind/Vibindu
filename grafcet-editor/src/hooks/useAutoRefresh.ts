import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useSimulationStore } from '../store/useSimulationStore';
import { useFileExplorerStore } from '../store/useFileExplorerStore';
import { useElementsStore } from '../store/useElementsStore';
import { useGsrsmFileStore } from '../store/useGsrsmFileStore';
import { ApiService } from '../services/apiService';

// Default refresh interval: 5 seconds
const DEFAULT_REFRESH_INTERVAL = 5000;

interface AutoRefreshOptions {
  interval?: number;
  enabled?: boolean;
  refreshIO?: boolean;
  refreshFileExplorer?: boolean;
  refreshDiagram?: boolean;
}

/**
 * Hook that automatically refreshes data from files at a specified interval.
 * Refreshes: IO (simulation), FileExplorer, and optionally the current diagram.
 */
export function useAutoRefresh(options: AutoRefreshOptions = {}) {
  const {
    interval = DEFAULT_REFRESH_INTERVAL,
    enabled = true,
    refreshIO = true,
    refreshFileExplorer = true,
    refreshDiagram = false, // Disabled by default to avoid overwriting user changes
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRefreshRef = useRef<number>(0);

  // Get current project from store
  const currentProjectId = useProjectStore(state => state.currentProjectId);
  const projects = useProjectStore(state => state.projects);
  const currentProject = projects.find(p => p.id === currentProjectId);

  // Refresh IO/Simulation data
  const refreshIOData = useCallback(async () => {
    if (!currentProject?.localPath) return;
    
    try {
      await useSimulationStore.getState().loadSimulation(currentProject.localPath);
    } catch (error) {
      console.error('[AutoRefresh] Failed to refresh IO data:', error);
    }
  }, [currentProject?.localPath]);

  // Refresh File Explorer
  const refreshFileExplorerData = useCallback(async () => {
    if (!currentProject?.localPath) return;
    
    try {
      await useFileExplorerStore.getState().loadFileTree(currentProject.localPath);
    } catch (error) {
      console.error('[AutoRefresh] Failed to refresh file explorer:', error);
    }
  }, [currentProject?.localPath]);

  // Refresh current diagram (SFC/GRAFCET/GRSM)
  const refreshDiagramData = useCallback(async () => {
    if (!currentProject?.localPath) return;
    
    const currentDiagramId = useProjectStore.getState().currentDiagramId;
    const project = useProjectStore.getState().projects.find(p => p.id === currentProjectId);
    const currentDiagram = project?.diagrams?.find(d => d.id === currentDiagramId);
    
    if (!currentDiagram?.filePath) return;
    
    try {
      const result = await ApiService.loadDiagram({ filePath: currentDiagram.filePath });
      if (result.success && result.diagram) {
        // Update elements store with loaded diagram elements
        useElementsStore.getState().setElements(result.diagram.elements || []);
      }
    } catch (error) {
      console.error('[AutoRefresh] Failed to refresh diagram:', error);
    }
  }, [currentProject?.localPath, currentProjectId]);

  // Main refresh function
  const refresh = useCallback(async () => {
    const now = Date.now();

    // Prevent rapid refreshes (minimum 1 second between refreshes)
    if (now - lastRefreshRef.current < 1000) return;

    // Don't auto-refresh while a diagram is being restored/loaded
    // This prevents interference with initial page load
    const isLoadingDiagram = useGsrsmFileStore.getState().isLoadingDiagram;
    if (isLoadingDiagram) {
      console.debug('[AutoRefresh] Skipping refresh - diagram is loading');
      return;
    }

    lastRefreshRef.current = now;

    const promises: Promise<void>[] = [];

    if (refreshIO) {
      promises.push(refreshIOData());
    }

    if (refreshFileExplorer) {
      promises.push(refreshFileExplorerData());
    }

    if (refreshDiagram) {
      promises.push(refreshDiagramData());
    }

    await Promise.allSettled(promises);
  }, [refreshIO, refreshFileExplorer, refreshDiagram, refreshIOData, refreshFileExplorerData, refreshDiagramData]);

  // Set up interval
  useEffect(() => {
    if (!enabled || !currentProject?.localPath) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial refresh
    refresh();

    // Set up polling interval
    intervalRef.current = setInterval(refresh, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, currentProject?.localPath, refresh]);

  // Return manual refresh function for on-demand refresh
  return { refresh };
}

