import { useId, useRef, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import type { SetupErrors, SetupField, SetupValues } from './logic/types.ts';
import { setupLimits } from './logic/validateSetup.ts';
import { MessageIcon } from './MessageIcon.tsx';
import styles from './SetupForm.module.css';

export interface SetupFormProps {
  readonly values: SetupValues;
  readonly errors: SetupErrors;
  readonly onChange: (field: SetupField, value: string) => void;
  readonly onStart: () => void;
}

const LABELS: Record<SetupField, string> = { rows: 'Rows', cols: 'Columns', mines: 'Mines' };
const FIELDS: readonly SetupField[] = ['rows', 'cols', 'mines'];
const MINES_FORMULA = 'rows × columns − 9';

function minesLimit(max: number | null): string {
  return max === null ? MINES_FORMULA : String(max);
}

/** The mines limit comes from the live values, the same source as the hint. */
function errorMessage(field: SetupField, minesMax: number | null): string {
  if (field !== 'mines') return `${LABELS[field]} must be a whole number from 5 to 30.`;
  return `Mines must be a whole number from 1 to ${minesLimit(minesMax)}.`;
}

/** Board setup (AC1, AC3): three text inputs with range hints, per-field errors and "Start". */
export function SetupForm({ values, errors, onChange, onStart }: SetupFormProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const limits = setupLimits(values);
  const hints: Record<SetupField, string> = {
    rows: `${limits.size.min} to ${limits.size.max}`,
    cols: `${limits.size.min} to ${limits.size.max}`,
    mines: `${limits.mines.min} to ${minesLimit(limits.mines.max)}`,
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Render the errors first, so the focused input already has its message as description.
    flushSync(onStart);
    formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }

  const shownErrors = FIELDS.flatMap((field) => {
    const error = errors[field];
    return error ? [{ field, message: errorMessage(field, limits.mines.max) }] : [];
  });

  return (
    <form ref={formRef} className={styles.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Board setup</legend>
        <div className={styles.fields}>
          {FIELDS.map((field) => {
            const inputId = `${id}-${field}`;
            const invalid = errors[field] !== undefined;
            return (
              <div className={styles.field} key={field}>
                <label htmlFor={inputId}>{LABELS[field]}</label>
                <input
                  id={inputId}
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={values[field]}
                  aria-invalid={invalid ? true : undefined}
                  aria-describedby={`${inputId}-hint${invalid ? ` ${inputId}-error` : ''}`}
                  onChange={(event) => onChange(field, event.target.value)}
                />
                <span id={`${inputId}-hint`} className={styles.hint}>
                  {hints[field]}
                </span>
              </div>
            );
          })}
        </div>
        {shownErrors.length > 0 && (
          <div className={styles.errors}>
            {shownErrors.map(({ field, message }) => (
              <p id={`${id}-${field}-error`} className={styles.error} key={field}>
                <MessageIcon kind="error" className={styles.icon} />
                {message}
              </p>
            ))}
          </div>
        )}
        <button type="submit" className={styles.start}>
          Start
        </button>
      </fieldset>
    </form>
  );
}
