import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Spinner.module.scss';

type SpinnerProps =
  | { label: string; decorative?: false; size?: 'sm' | 'md'; className?: string }
  | { label?: never; decorative: true; size?: 'sm' | 'md'; className?: string };

export function Spinner({ label, decorative, size = 'md', className }: SpinnerProps): ReactNode {
  if (decorative) {
    return <span aria-hidden="true" className={cn(styles.spinner, styles[size], className)} />;
  }
  return (
    <span role="status" className={cn(styles.wrapper, className)}>
      <span aria-hidden="true" className={cn(styles.spinner, styles[size])} />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
