import { useId } from 'react';
import { COPY } from './fieldCopy.ts';
import styles from './CheckboxOption.module.css';

export interface CheckboxOptionProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

/** The tax checkbox (UX design §1): one 44 px row of box and label; never invalid, never disabled. */
export function CheckboxOption({ checked, onChange }: CheckboxOptionProps) {
  const inputId = useId();
  return (
    <div className={styles.option}>
      {/* The whole row is the label, so box and text are one 44 px target. */}
      <label htmlFor={inputId} className={styles.row}>
        <input
          id={inputId}
          className={styles.box}
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            onChange(event.target.checked);
          }}
        />
        {COPY.taxCheckbox}
      </label>
    </div>
  );
}
