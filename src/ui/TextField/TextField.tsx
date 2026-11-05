import { type InputHTMLAttributes, type ReactNode, type Ref, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './TextField.module.scss';

interface BaseProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    multiline?: false;
    ref?: Ref<HTMLInputElement>;
  };

type TextareaProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLTextAreaElement>, 'className' | 'type'> & {
    multiline: true;
    rows?: number;
    ref?: Ref<HTMLTextAreaElement>;
  };

export type TextFieldProps = InputProps | TextareaProps;

const describedBy = (...ids: Array<string | false | undefined>): string | undefined =>
  ids.filter(Boolean).join(' ') || undefined;

export function TextField(props: TextFieldProps): ReactNode {
  const { label, hint, error, className, id: idProp } = props;
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const a11y = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy(hintId, errorId),
  } as const;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {renderControl(props, a11y)}
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

type A11yProps = { id: string; 'aria-invalid': true | undefined; 'aria-describedby'?: string };

function renderControl(props: TextFieldProps, a11y: A11yProps): ReactNode {
  if (props.multiline) {
    const { label, hint, error, className, multiline, ref, rows = 5, ...rest } = props;
    return <textarea ref={ref} rows={rows} className={styles.control} {...rest} {...a11y} />;
  }
  const { label, hint, error, className, multiline, ref, type = 'text', ...rest } = props;
  return <input ref={ref} type={type} className={styles.control} {...rest} {...a11y} />;
}
