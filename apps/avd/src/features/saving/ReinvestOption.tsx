import { useId } from 'react';
import { REINVEST_COPY } from './fieldCopy.ts';
import styles from './ReinvestOption.module.css';

export interface ReinvestOptionProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * The checkbox "Steuererstattung wieder anlegen" (story 015, AC1, UX §1, §6): not a text field,
 * never invalid or disabled; one stable native input, so focus stays on it while toggling.
 */
export function ReinvestOption({ checked, onChange }: ReinvestOptionProps) {
  const id = useId();
  const inputId = `${id}-reinvest`;
  const hintId = `${inputId}-hint`;
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
        {REINVEST_COPY.label}
      </label>
      <p id={hintId} className={styles.hint}>
        {REINVEST_COPY.hint}
      </p>
    </div>
  );
}
