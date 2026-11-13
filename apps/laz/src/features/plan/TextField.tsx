import { ErrorIcon } from './ErrorIcon.tsx';
import { errorMessage, type FieldCopy } from './fieldCopy.ts';
import type { FieldError } from './logic/parseInputs.ts';
import styles from './TextField.module.css';

export interface TextFieldProps {
  readonly copy: FieldCopy;
  /** The input's id; the hint, error and marker ids derive from it. */
  readonly inputId: string;
  /** The raw text, exactly as typed (UX design §4). */
  readonly value: string;
  readonly error: FieldError | undefined;
  /** The user-override marker, part of the field's description (AC5). */
  readonly marker?: string | undefined;
  /** A label only assistive technology reads, as UX §2 asks for a table cell. */
  readonly hiddenLabel?: boolean | undefined;
  readonly onChange: (value: string) => void;
}

/** One labelled text input with hint, error and marker; error and marker are descriptions. */
export function TextField({
  copy,
  inputId,
  value,
  error,
  marker,
  hiddenLabel,
  onChange,
}: TextFieldProps) {
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const markerId = marker === undefined ? undefined : `${inputId}-marker`;
  const description = [hintId, error === undefined ? undefined : errorId, markerId].filter(
    (id) => id !== undefined,
  );
  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={hiddenLabel ? styles.hiddenLabel : undefined}>
        {copy.label}
      </label>
      <input
        id={inputId}
        className={styles.input}
        type="text"
        inputMode={copy.formatWord === 'kein gültiges Datum' ? 'text' : 'decimal'}
        autoComplete="off"
        spellCheck={false}
        value={value}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={description.join(' ')}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <p id={hintId} className={styles.hint}>
        {copy.hint}
      </p>
      {markerId !== undefined && (
        <p id={markerId} className={styles.marker}>
          {marker}
        </p>
      )}
      {error !== undefined && (
        <p id={errorId} className={styles.error}>
          <ErrorIcon className={styles.icon} />
          <span>{errorMessage(copy, error)}</span>
        </p>
      )}
    </div>
  );
}
