import { describe, expect, it } from 'vitest';
import { useUiStore } from './ui-store';

describe('useUiStore', () => {
  it('toggles and closes navigation', () => {
    useUiStore.getState().toggleNav();
    expect(useUiStore.getState().isNavOpen).toBe(true);
    useUiStore.getState().closeNav();
    expect(useUiStore.getState().isNavOpen).toBe(false);
  });
});
