import { create } from 'zustand';

/** Client UI state only. Server data belongs in TanStack Query; never persist tokens here. */
interface UiState {
  isNavOpen: boolean;
  toggleNav: () => void;
  closeNav: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isNavOpen: false,
  toggleNav: () => set((state) => ({ isNavOpen: !state.isNavOpen })),
  closeNav: () => set({ isNavOpen: false }),
}));
