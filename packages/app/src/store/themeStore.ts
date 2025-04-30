import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
    isDarkMode: boolean;
    toggleTheme: () => void;
    setDarkMode: (isDark: boolean) => void;
}

// Helper function to get initial theme state
const getInitialTheme = (): boolean => {
    // Check if we have a stored preference
    const storedTheme = localStorage.getItem('theme-storage');
    if (storedTheme) {
        try {
            const data = JSON.parse(storedTheme);
            if (data && data.state && typeof data.state.isDarkMode === 'boolean') {
                return data.state.isDarkMode;
            }
        } catch (e) {
            console.error('Failed to parse stored theme', e);
        }
    }
    
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            isDarkMode: getInitialTheme(),
            toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setDarkMode: (isDark: boolean) => set({ isDarkMode: isDark }),
        }),
        {
            name: 'theme-storage',
        }
    )
); 