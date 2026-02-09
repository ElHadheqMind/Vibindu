import { create } from 'zustand';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveState {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  error: string | null;
  
  // Actions
  setSaving: () => void;
  setSaved: () => void;
  setError: (error: string) => void;
  setIdle: () => void;
}

export const useAutoSaveStore = create<AutoSaveState>((set) => ({
  status: 'idle',
  lastSaved: null,
  error: null,
  
  setSaving: () => set({ status: 'saving', error: null }),
  
  setSaved: () => set({ 
    status: 'saved', 
    lastSaved: new Date(), 
    error: null 
  }),
  
  setError: (error: string) => set({ 
    status: 'error', 
    error 
  }),
  
  setIdle: () => set({ status: 'idle', error: null }),
}));
