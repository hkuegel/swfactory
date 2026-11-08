import { useId } from 'react';
import styles from './CheckboxOption.module.css';

export interface CheckboxOptionProps {
  readonly label: string;
  /** Always visible below the row, the box's description. */
  readonly hint: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/**
 * A labelled checkbox with a hint, in the right cell next to a field (story 015 reinvest box,
 * story 016 Pauschbetrag box; UX §1, §6): not a text field, never invalid or disabled; one stable
 * native input, so focus stays on it while toggling.
 */
export function CheckboxOption({ label, hint, checked, onChange }: CheckboxOptionProps) {
  const id = useId();
  const inputId = `${id}-box`;
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
        {label}
      </label>
      <p id={hintId} className={styles.hint}>
        {hint}
      </p>
    </div>
  );
}
