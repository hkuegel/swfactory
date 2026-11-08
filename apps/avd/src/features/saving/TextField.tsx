import { ErrorIcon } from './ErrorIcon.tsx';
import { errorMessage, FIELD_COPY } from './fieldCopy.ts';
import { FIELD_SPECS, type FieldId } from './logic/fields.ts';
import type { FieldError } from './logic/parseInputs.ts';
import styles from './TextField.module.css';

export interface TextFieldProps {
  readonly field: FieldId;
  /** The input's id; the hint and error ids derive from it. */
  readonly inputId: string;
  readonly value: string;
  readonly error: FieldError | undefined;
  readonly onChange: (field: FieldId, value: string) => void;
}

function inputModeFor(field: FieldId) {
  const spec = FIELD_SPECS[field];
  // The iOS decimal keypad has no minus key: fields that allow negative values need the full keyboard.
  if (spec.min < 0) return 'text';
  return spec.decimals === 0 ? 'numeric' : 'decimal';
}

/**
 * One labelled text input with suffix, hint and error (013/014/016 AC1, AC6/AC9, AC7/AC10): the
 * error is a description of the input, without a role.
 */
export function TextField({ field, inputId, value, error, onChange }: TextFieldProps) {
  const copy = FIELD_COPY[field];
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{copy.label}</label>
      <div className={styles.control}>
        <input
          id={inputId}
          className={styles.input}
          type="text"
          inputMode={inputModeFor(field)}
          autoComplete="off"
          spellCheck={false}
          value={value}
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
}
