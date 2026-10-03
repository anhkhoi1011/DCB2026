import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function subscribeToSystemTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => callback();
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

export function useResolvedTheme(): {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
} {
  const theme = useAppStore((s) => s.settings.theme || 'system');
  const updateSettings = useAppStore((s) => s.updateSettings);

  // Synchronously subscribe to media query changes
  const isSystemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemDark,
    () => false
  );

  const resolvedTheme: ResolvedTheme =
    theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : isSystemDark ? 'dark' : 'light';

  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (mode: ThemeMode) => {
    updateSettings({ theme: mode });
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
  };
}
