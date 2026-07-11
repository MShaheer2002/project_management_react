import React, { useEffect } from 'react';
import { useThemeStore } from '@/app/stores/useThemeStore';
import { applyThemeToDom, watchSystemTheme } from '@shared/theme/theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    applyThemeToDom(theme);

    if (theme !== 'system') return;

    return watchSystemTheme(() => {
      applyThemeToDom(useThemeStore.getState().theme);
    });
  }, [theme]);

  return <>{children}</>;
};
