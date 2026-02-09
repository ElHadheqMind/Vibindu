import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GrafcetElement, HistoryEntry } from '../models/types';
import { useElementsStore } from './useElementsStore';

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistorySize: number;
  
  // Actions
  addHistoryEntry: (elements: GrafcetElement[]) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Getters
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      past: [],
      future: [],
      maxHistorySize: 50,
  
  // Actions
  addHistoryEntry: (elements: GrafcetElement[]) => {
    const entry: HistoryEntry = {
      elements: JSON.parse(JSON.stringify(elements)), // Deep copy
      timestamp: Date.now(),
    };
    
    set((state) => {
      // Limit history size
      const newPast = [...state.past, entry].slice(-state.maxHistorySize);
      
      return {
        past: newPast,
        future: [], // Clear future when new action is performed
      };
    });
  },
  
  undo: () => {
    const { past } = get();
    
    if (past.length === 0) return;
    
    const newPast = [...past];
    const currentState = newPast.pop();
    
    if (!currentState) return;
    
    // Get the previous state
    const previousState = newPast.length > 0 ? newPast[newPast.length - 1] : null;
    
    // Save current state to future
    set((state) => ({
      past: newPast,
      future: [currentState, ...state.future],
    }));
    
    // Apply previous state
    if (previousState) {
      const elementsStore = useElementsStore.getState();
      elementsStore.selectElements([]);
      
      // Replace elements with previous state
      useElementsStore.setState({
        elements: JSON.parse(JSON.stringify(previousState.elements)),
      });
    } else {
      // If no previous state, clear elements
      useElementsStore.setState({
        elements: [],
      });
    }
  },
  
  redo: () => {
    const { future } = get();
    
    if (future.length === 0) return;
    
    const newFuture = [...future];
    const nextState = newFuture.shift();
    
    if (!nextState) return;
    
    // Save next state to past
    set((state) => ({
      past: [...state.past, nextState],
      future: newFuture,
    }));
    
    // Apply next state
    const elementsStore = useElementsStore.getState();
    elementsStore.selectElements([]);
    
    // Replace elements with next state
    useElementsStore.setState({
      elements: JSON.parse(JSON.stringify(nextState.elements)),
    });
  },
  
  clearHistory: () => {
    set({
      past: [],
      future: [],
    });
  },
  
  // Getters
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
    }),
    {
      name: 'grafcet-history-state',
      partialize: (state) => ({
        // Persist history but limit size to prevent localStorage bloat
        past: state.past.slice(-20), // Keep only last 20 entries
        future: state.future.slice(0, 20), // Keep only first 20 entries
        maxHistorySize: state.maxHistorySize,
      }),
    }
  )
);
