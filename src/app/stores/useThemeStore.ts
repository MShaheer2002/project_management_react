import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'app-theme' }
  )
);

// Side effect: apply theme to DOM
const applyTheme = (t: 'light' | 'dark') => {
  const root = document.documentElement;
  const body = document.body;
  if (t === 'dark') {
    root.classList.add('dark');
    body.classList.add('dark');
    body.classList.remove('light');
  } else {
    root.classList.remove('dark');
    body.classList.add('light');
    body.classList.remove('dark');
  }
};

const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

// Apply on every change
useThemeStore.subscribe((state) => {
  applyTheme(resolveTheme(state.theme));
});

// Apply immediately on load
applyTheme(resolveTheme(useThemeStore.getState().theme));

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useThemeStore.getState().theme === 'system') {
    applyTheme(resolveTheme('system'));
  }
});
