import { create } from 'zustand';

/**
 * SaveStatusStore - Tracks save state for explicit save operations
 * Replaces the old AutoSaveStore with cleaner semantics
 */

interface SaveStatusState {
    isDirty: boolean;              // True if unsaved changes exist
    lastSavedAt: Date | null;      // Timestamp of last save
    isSaving: boolean;             // True while save in progress
    error: string | null;          // Error message if save failed

    // Actions
    markDirty: () => void;
    markClean: () => void;
    startSaving: () => void;
    saveDone: () => void;
    saveError: (msg: string) => void;
    reset: () => void;
}

export const useSaveStatusStore = create<SaveStatusState>((set) => ({
    isDirty: false,
    lastSavedAt: null,
    isSaving: false,
    error: null,

    markDirty: () => set({ isDirty: true, error: null }),

    markClean: () => set({ isDirty: false }),

    startSaving: () => set({ isSaving: true, error: null }),

    saveDone: () => set({
        isSaving: false,
        isDirty: false,
        lastSavedAt: new Date(),
        error: null
    }),

    saveError: (msg: string) => set({
        isSaving: false,
        error: msg
    }),

    reset: () => set({
        isDirty: false,
        lastSavedAt: null,
        isSaving: false,
        error: null
    })
}));
