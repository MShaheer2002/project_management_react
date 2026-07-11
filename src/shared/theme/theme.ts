import type { Theme } from '@/app/stores/useThemeStore';

const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function applyThemeToDom(theme: Theme) {
  if (typeof document === 'undefined') return;

  const resolvedTheme = resolveTheme(theme);
  const root = document.documentElement;
  const body = document.body;
  const isDark = resolvedTheme === 'dark';

  root.classList.toggle('dark', isDark);
  body.classList.toggle('dark', isDark);
  body.classList.toggle('light', !isDark);
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

export function watchSystemTheme(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
}
