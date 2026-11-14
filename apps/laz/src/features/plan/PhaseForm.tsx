import { useId } from 'react';
import { CheckboxOption } from './CheckboxOption.tsx';
import { amountCopy, COPY, FIELD_COPY, TAX_COPY } from './fieldCopy.ts';
import { FIELD_IDS, type Direction, type FieldId, type RawInputs } from './logic/fields.ts';
import type { FieldErrors } from './logic/parseInputs.ts';
import { BUNDESLAENDER, type TaxState } from './logic/tax.ts';
import { TextField } from './TextField.tsx';
import styles from './PhaseForm.module.css';

export interface PhaseFormProps {
  readonly direction: Direction;
  readonly raw: RawInputs;
  /** Errors are shown only after the first edit (UX design §3). */
  readonly errors: FieldErrors;
  /** The tax checkboxes and the Bundesland (story 031); nothing here can be invalid. */
  readonly tax: TaxState;
  readonly onDirection: (direction: Direction) => void;
  readonly onField: (field: FieldId, value: string) => void;
  readonly onTax: (next: TaxState) => void;
}

/** The form whose accessible name is the visible `h2` "Eingaben", the sign-in probe (UX §1). */
export function PhaseForm({
  direction,
  raw,
  errors,
  tax,
  onDirection,
  onField,
  onTax,
}: PhaseFormProps) {
  const headingId = useId();
  const selectId = `${headingId}-bundesland`;
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

      {FIELD_IDS.map((field) => (
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
      ))}

      {/* Story 031: the rates are the statutory ones, so the typed rate field is gone. A checkbox and a
          select cannot hold a value outside their options, so this block has no error state. */}
      <fieldset className={styles.fieldset}>
        <legend>{TAX_COPY.legend}</legend>
        <CheckboxOption
          checked={tax.kstOn}
          label={TAX_COPY.kstLabel}
          hint={TAX_COPY.kstHint}
          onChange={(checked) => {
            onTax({ ...tax, kstOn: checked });
          }}
        />
        <CheckboxOption
          checked={tax.kistOn}
          label={TAX_COPY.kistLabel}
          hint={TAX_COPY.kistHint}
          onChange={(checked) => {
            onTax({ ...tax, kistOn: checked });
          }}
        />
        <div className={styles.field}>
          <label htmlFor={selectId}>{TAX_COPY.bundeslandLabel}</label>
          {/* Never disabled, even while the church tax is unchecked: the AC of 024 keeps every control reachable (story 033, AC3). */}
          <select
            id={selectId}
            className={styles.select}
            value={tax.bundesland}
            onChange={(event) => {
              onTax({ ...tax, bundesland: event.target.value });
            }}
          >
            {BUNDESLAENDER.map((land) => (
              <option key={land.id} value={land.id}>
                {land.name} ({String(land.kistPercent)} %)
              </option>
            ))}
          </select>
        </div>
      </fieldset>
    </form>
  );
}
