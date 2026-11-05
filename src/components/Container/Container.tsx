import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Container.module.scss';

interface ContainerProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

export function Container({ as: Tag = 'div', className, children }: ContainerProps): ReactNode {
  return <Tag className={cn(styles.container, className)}>{children}</Tag>;
}
