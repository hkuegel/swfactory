import { useId, useRef, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { PRESETS } from './logic/presets.ts';
import type { Preset, SetupErrors, SetupField, SetupValues } from './logic/types.ts';
import { setupLimits } from './logic/validateSetup.ts';
import { MessageIcon } from './MessageIcon.tsx';
import styles from './SetupForm.module.css';

export interface SetupFormProps {
  readonly values: SetupValues;
  readonly errors: SetupErrors;
  readonly onChange: (field: SetupField, value: string) => void;
  readonly onPreset: (preset: Preset) => void;
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

/** Board setup (AC1, AC3): presets, three text inputs with range hints, per-field errors and "Start". */
export function SetupForm({ values, errors, onChange, onPreset, onStart }: SetupFormProps) {
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
        <fieldset className={styles.presets}>
          <legend className={styles.legend}>Difficulty</legend>
          <div className={styles.presetRow}>
            {PRESETS.map((preset) => {
              const { rows, cols, mines } = preset.config;
              const descriptionId = `${id}-preset-${preset.name}`;
              return (
                <div className={styles.preset} key={preset.name}>
                  {/* The description sits outside the button so it is not part of its name. */}
                  <button
                    type="button"
                    className={styles.presetButton}
                    aria-describedby={descriptionId}
                    onClick={() => onPreset(preset)}
                  >
                    {preset.name}
                    <span className={styles.presetDetail} aria-hidden="true">
                      {rows} × {cols}, {mines} mines
                    </span>
                  </button>
                  <span id={descriptionId} className={styles.visuallyHidden}>
                    {rows} rows, {cols} columns, {mines} mines
                  </span>
                </div>
              );
            })}
          </div>
        </fieldset>
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
