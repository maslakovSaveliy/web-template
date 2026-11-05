import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.scss';

/** Content for screen readers only. */
export function VisuallyHidden({ children }: { children: ReactNode }): ReactNode {
  return <span className={styles.root}>{children}</span>;
}
