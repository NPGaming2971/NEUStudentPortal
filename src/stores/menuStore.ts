import { create } from 'zustand';
import { getMenu, type SidebarMenuItem } from '@/services/menuService';

interface MenuState {
    menu: SidebarMenuItem[];
    isLoading: boolean;
    error: string | null;

    fetchMenu: (force?: boolean) => Promise<void>;
    clearMenu: () => void;
}

export const useMenuStore = create<MenuState>()((set, get) => ({
    menu: [],
    isLoading: false,
    error: null,

    fetchMenu: async (force = false) => {
        if (!force && (get().menu.length > 0 || get().isLoading)) return;

        set({ isLoading: true, error: null });
        try {
            const menu = await getMenu();
            set({ menu, isLoading: false });
        } catch (error) {
            console.error('Error fetching menu:', error);
            set({ error: 'Không thể tải menu', isLoading: false });
        }
    },

    clearMenu: () => set({ menu: [], isLoading: false, error: null }),
}));