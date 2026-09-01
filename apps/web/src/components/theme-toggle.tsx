'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'ssegning-theme';
const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};
const ICON: Record<ThemePreference, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};
const LABEL: Record<ThemePreference, string> = {
  system: 'Theme: matching system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

function applyTheme(preference: ThemePreference) {
  if (preference === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', preference);
  }
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreference(stored);
    }
    setMounted(true);
  }, []);

  function cycle() {
    const next = NEXT_PREFERENCE[preference];
    setPreference(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  const Icon = ICON[preference];

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-control border border-border text-ink-muted transition-colors duration-150 ease-out hover:border-border-strong hover:text-ink"
      aria-label={mounted ? LABEL[preference] : 'Toggle theme'}
      title={mounted ? LABEL[preference] : 'Toggle theme'}
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
