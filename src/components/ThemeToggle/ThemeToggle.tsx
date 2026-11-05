'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { type ReactNode, useSyncExternalStore } from 'react';
import { Button } from '@/ui';

const ORDER = ['light', 'dark', 'system'] as const;
type ThemeName = (typeof ORDER)[number];

const ICONS: Record<ThemeName, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const ICON_SIZE = 18;

const subscribe = (): (() => void) => () => {};
// Theme is only known on the client; render a stable placeholder on the server.
const useIsClient = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

const isThemeName = (value: string | undefined): value is ThemeName =>
  ORDER.includes(value as ThemeName);

export function ThemeToggle(): ReactNode {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();
  const current: ThemeName = isClient && isThemeName(theme) ? theme : 'system';
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? 'system';
  const Icon = ICONS[current];

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`${t('toggle')}: ${t(current)}`}
      onClick={() => setTheme(next)}
    >
      <Icon size={ICON_SIZE} aria-hidden="true" />
    </Button>
  );
}
