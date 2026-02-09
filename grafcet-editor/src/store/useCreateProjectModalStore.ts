import { create } from 'zustand';

interface CreateProjectModalState {
    isOpen: boolean;
    initialType: 'grafcet' | 'gsrsm' | null;
    openModal: (type?: 'grafcet' | 'gsrsm') => void;
    closeModal: () => void;
}

export const useCreateProjectModalStore = create<CreateProjectModalState>((set) => ({
    isOpen: false,
    initialType: null,
    openModal: (type) => set({ isOpen: true, initialType: type || null }),
    closeModal: () => set({ isOpen: false, initialType: null }),
}));
