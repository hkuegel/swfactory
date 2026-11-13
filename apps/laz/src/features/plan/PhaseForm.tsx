import { useId } from 'react';
import { CheckboxOption } from './CheckboxOption.tsx';
import { amountCopy, COPY, FIELD_COPY } from './fieldCopy.ts';
import { FIELD_IDS, type Direction, type FieldId, type RawInputs } from './logic/fields.ts';
import type { FieldErrors } from './logic/parseInputs.ts';
import { TextField } from './TextField.tsx';
import styles from './PhaseForm.module.css';

export interface PhaseFormProps {
  readonly direction: Direction;
  readonly raw: RawInputs;
  /** Errors are shown only after the first edit (UX design §3). */
  readonly errors: FieldErrors;
  readonly taxOn: boolean;
  readonly onDirection: (direction: Direction) => void;
  readonly onField: (field: FieldId, value: string) => void;
  readonly onTax: (checked: boolean) => void;
}

/** The form whose accessible name is the visible `h2` "Eingaben", the sign-in probe (UX §1). */
export function PhaseForm({
  direction,
  raw,
  errors,
  taxOn,
  onDirection,
  onField,
  onTax,
}: PhaseFormProps) {
  const headingId = useId();
  return (
    <form
      className={styles.form}
      aria-labelledby={headingId}
      noValidate
      onSubmit={(event) => {
        // No submit button; Enter must not reload the page (UX §4).
        event.preventDefault();
      }}
    >
      <h2 id={headingId}>{COPY.inputsHeading}</h2>

      <fieldset className={styles.fieldset}>
        <legend>{COPY.directionLegend}</legend>
        {/* Two native radios: arrow keys select, no roving tabindex needed (UX §4). */}
        <label htmlFor={`${headingId}-depot`} className={styles.radio}>
          <input
            id={`${headingId}-depot`}
            type="radio"
            name="direction"
            value="depot"
            checked={direction === 'depot'}
            onChange={() => {
              onDirection('depot');
            }}
          />
          {COPY.depotRadio}
        </label>
        <label htmlFor={`${headingId}-payout`} className={styles.radio}>
          <input
            id={`${headingId}-payout`}
            type="radio"
            name="direction"
            value="payout"
            checked={direction === 'payout'}
            onChange={() => {
              onDirection('payout');
            }}
          />
          {COPY.payoutRadio}
        </label>
      </fieldset>

      {FIELD_IDS.map((field) => {
        if (field === 'taxRate') {
          return (
            <div key={field} className={styles.row}>
              <CheckboxOption
                checked={taxOn}
                onChange={(checked) => {
                  onTax(checked);
                }}
              />
              <TextField
                copy={FIELD_COPY.taxRate}
                inputId={`field-${field}`}
                value={raw[field]}
                error={errors[field]}
                onChange={(value) => {
                  onField(field, value);
                }}
              />
            </div>
          );
        }
        return (
          <TextField
            key={field}
            copy={field === 'amount' ? amountCopy(direction) : FIELD_COPY[field]}
            inputId={`field-${field}`}
            value={raw[field]}
            error={errors[field]}
            onChange={(value) => {
              onField(field, value);
            }}
          />
        );
      })}
    </form>
  );
}
