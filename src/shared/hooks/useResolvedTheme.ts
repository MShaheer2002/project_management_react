import { useEffect, useState } from 'react';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { getSystemTheme, resolveTheme, watchSystemTheme } from '@shared/theme/theme';

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useThemeStore((state) => state.theme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(theme));

  useEffect(() => {
    setResolvedTheme(resolveTheme(theme));

    if (theme !== 'system') return;

    setResolvedTheme(getSystemTheme());
    return watchSystemTheme(() => {
      setResolvedTheme(getSystemTheme());
    });
  }, [theme]);

  return resolvedTheme;
}
