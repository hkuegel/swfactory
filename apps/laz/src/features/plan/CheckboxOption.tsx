import { useId } from 'react';
import styles from './CheckboxOption.module.css';

export interface CheckboxOptionProps {
  readonly checked: boolean;
  /** The label text, from the copy module. */
  readonly label: string;
  /** The rule the label quotes; shown under the row and referenced as the accessible description (UX §2). */
  readonly hint?: string;
  readonly onChange: (checked: boolean) => void;
}

/** One 44 px row of box and label; never invalid, never disabled (story 031, UX §1). */
export function CheckboxOption({ checked, label, hint, onChange }: CheckboxOptionProps) {
  const inputId = useId();
  const hintId = hint === undefined ? undefined : `${inputId}-hint`;
  return (
    <div className={styles.option}>
      {/* The whole row is the label, so box and text are one 44 px target. */}
      <label htmlFor={inputId} className={styles.row}>
        <input
          id={inputId}
          className={styles.box}
          type="checkbox"
          checked={checked}
          aria-describedby={hintId}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
        />
        {label}
      </label>
      {hintId !== undefined && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
}
