import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApiService } from '../services/apiService';

/**
 * FileExplorerStore - Persists file explorer UI state
 * Expanded folders and selection survive page refresh
 */

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    isExpanded?: boolean;
}

interface FileExplorerState {
    // Persisted state
    expandedPaths: string[];
    selectedPath: string | null;

    // Non-persisted cache
    fileTreeCache: FileNode[];
    isLoading: boolean;
    error: string | null;

    // Actions
    toggleExpanded: (path: string) => void;
    setExpanded: (path: string, expanded: boolean) => void;
    setSelected: (path: string | null) => void;
    setFileTree: (tree: FileNode[]) => void;
    loadFileTree: (targetPath?: string) => Promise<void>;
    applyExpandedState: (nodes: FileNode[]) => FileNode[];
    initializeListeners: () => void;
}

export const useFileExplorerStore = create<FileExplorerState>()(
    persist(
        (set, get) => ({
            // Initial state
            expandedPaths: [],
            selectedPath: null,
            fileTreeCache: [],
            isLoading: false,
            error: null,

            toggleExpanded: (path: string) => {
                const normalizedPath = path.replace(/\\/g, '/');
                const { expandedPaths, fileTreeCache } = get();
                const isExpanded = expandedPaths.includes(normalizedPath);
                const newExpandedPaths = isExpanded
                    ? expandedPaths.filter(p => p !== normalizedPath)
                    : [...expandedPaths, normalizedPath];

                set({ expandedPaths: newExpandedPaths });

                // Re-apply expanded state to cache to trigger UI update
                const treeWithState = get().applyExpandedState(fileTreeCache);
                set({ fileTreeCache: treeWithState });
            },

            setExpanded: (path: string, expanded: boolean) => {
                const normalizedPath = path.replace(/\\/g, '/');
                const { expandedPaths, fileTreeCache } = get();
                const isCurrentlyExpanded = expandedPaths.includes(normalizedPath);

                let newExpandedPaths = expandedPaths;
                if (expanded && !isCurrentlyExpanded) {
                    newExpandedPaths = [...expandedPaths, normalizedPath];
                } else if (!expanded && isCurrentlyExpanded) {
                    newExpandedPaths = expandedPaths.filter(p => p !== normalizedPath);
                }

                if (newExpandedPaths !== expandedPaths) {
                    set({ expandedPaths: newExpandedPaths });

                    // Re-apply expanded state to cache to trigger UI update
                    const treeWithState = get().applyExpandedState(fileTreeCache);
                    set({ fileTreeCache: treeWithState });
                }
            },

            setSelected: (path: string | null) => {
                const normalizedPath = path ? path.replace(/\\/g, '/') : null;
                set({ selectedPath: normalizedPath });
            },

            setFileTree: (tree: FileNode[]) => {
                // Apply expanded state to the new tree
                const treeWithState = get().applyExpandedState(tree);
                set({ fileTreeCache: treeWithState, error: null });
            },

            loadFileTree: async (targetPath?: string) => {
                set({ isLoading: true, error: null });

                try {
                    const data = await ApiService.getFileTree(targetPath || '');

                    if (data.success && data.tree) {
                        const children = data.tree.children || [];

                        // Normalize the tree to ensure 'type' property exists (API returns isDirectory)
                        // Also normalize paths to forward slashes for consistent matching
                        const normalizeTree = (nodes: any[]): FileNode[] => {
                            return nodes.map((node: any) => ({
                                name: node.name,
                                path: node.path.replace(/\\/g, '/'),
                                type: node.type || (node.isDirectory ? 'folder' : 'file'),
                                children: node.children ? normalizeTree(node.children) : undefined,
                            }) as FileNode);
                        };

                        const normalizedChildren = normalizeTree(children);
                        const treeWithState = get().applyExpandedState(normalizedChildren);

                        set({
                            fileTreeCache: treeWithState,
                            isLoading: false,
                            error: null
                        });
                    } else {
                        set({
                            error: data.error || 'Failed to load file tree',
                            isLoading: false
                        });
                    }
                } catch (error) {
                    console.error('Error loading file tree:', error);
                    set({
                        error: 'Failed to load file tree',
                        isLoading: false
                    });
                }
            },

            // Apply persisted expanded state to tree nodes
            applyExpandedState: (nodes: FileNode[]): FileNode[] => {
                const { expandedPaths } = get();

                const applyRecursively = (nodeList: FileNode[]): FileNode[] => {
                    return nodeList.map(node => {
                        const isExpanded = expandedPaths.includes(node.path);
                        return {
                            ...node,
                            isExpanded,
                            children: node.children ? applyRecursively(node.children) : undefined
                        };
                    });
                };

                return applyRecursively(nodes);
            },

            initializeListeners: () => {
                import('./useSocketStore').then(({ useSocketStore }) => {
                    const socketStore = useSocketStore.getState();

                    // Ensure connected
                    socketStore.connect();

                    const handleRefresh = () => {
                        console.log('🔄 File event received, refreshing explorer...');
                        const { loadFileTree } = get();
                        // Reload tree with current view context
                        loadFileTree();
                    };

                    socketStore.subscribe('file:created', handleRefresh);
                    socketStore.subscribe('file:deleted', handleRefresh);
                    socketStore.subscribe('dir:created', handleRefresh);
                    socketStore.subscribe('dir:deleted', handleRefresh);
                });
            }
        }),
        {
            name: 'grafcet-file-explorer',
            partialize: (state) => ({
                // Only persist UI state, not the file tree cache
                expandedPaths: state.expandedPaths,
                selectedPath: state.selectedPath
            })
        }
    )
);
