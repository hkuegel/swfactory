import type { ComponentPropsWithRef } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'className'> {
  readonly variant: 'primary' | 'secondary';
  /** Extra class for layout or a variant marker (e.g. the dashed dev guest button). */
  readonly className?: string | undefined;
}

/** The app's one button look: filled for the primary action, outlined for secondary ones. */
export function Button({ variant, className, type, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <button type={type ?? 'button'} className={classes} {...rest} />;
}
