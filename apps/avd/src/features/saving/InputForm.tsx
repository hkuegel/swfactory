import { useId, type FormEvent } from 'react';
import { ErrorIcon } from './ErrorIcon.tsx';
import { errorMessage, FIELD_COPY } from './fieldCopy.ts';
import { FIELD_IDS, FIELD_SPECS, type FieldId, type RawInputs } from './logic/fields.ts';
import type { FieldErrors } from './logic/parseInputs.ts';
import styles from './InputForm.module.css';

export interface InputFormProps {
  readonly values: RawInputs;
  readonly errors: FieldErrors;
  readonly onChange: (field: FieldId, value: string) => void;
}

function inputModeFor(field: FieldId) {
  const spec = FIELD_SPECS[field];
  // The iOS decimal keypad has no minus key: fields that allow negative values need the full keyboard.
  if (spec.min < 0) return 'text';
  return spec.decimals === 0 ? 'numeric' : 'decimal';
}

function preventSubmit(event: FormEvent<HTMLFormElement>) {
  // No submit button: the result follows every keystroke. Enter must never reload the page.
  event.preventDefault();
}

/** The six labelled text inputs with hint and error (AC1, AC6, AC7). */
export function InputForm({ values, errors, onChange }: InputFormProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  return (
    <form className={styles.form} aria-labelledby={headingId} noValidate onSubmit={preventSubmit}>
      <h2 id={headingId}>Eingaben</h2>
      <div className={styles.fields}>
        {FIELD_IDS.map((field) => {
          const copy = FIELD_COPY[field];
          const error = errors[field];
          const inputId = `${id}-${field}`;
          const hintId = `${inputId}-hint`;
          const errorId = `${inputId}-error`;
          return (
            <div key={field} className={styles.field}>
              <label htmlFor={inputId}>{copy.label}</label>
              <div className={styles.control}>
                <input
                  id={inputId}
                  className={styles.input}
                  type="text"
                  inputMode={inputModeFor(field)}
                  autoComplete="off"
                  spellCheck={false}
                  value={values[field]}
                  aria-invalid={error === undefined ? undefined : true}
                  aria-describedby={error === undefined ? hintId : `${hintId} ${errorId}`}
                  onChange={(event) => {
                    onChange(field, event.target.value);
                  }}
                />
                <span className={styles.suffix} aria-hidden="true">
                  {copy.suffix}
                </span>
              </div>
              <p id={hintId} className={styles.hint}>
                {copy.hint}
              </p>
              {error !== undefined && (
                <p id={errorId} className={styles.error}>
                  <ErrorIcon className={styles.icon} />
                  <span>{errorMessage(field, error)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </form>
  );
}
