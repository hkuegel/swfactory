import { useId } from 'react';
import { CheckboxOption } from './CheckboxOption.tsx';
import { DEPOSIT_COPY, amountCopy, COPY, FIELD_COPY, TAX_COPY } from './fieldCopy.ts';
import { FIELD_IDS, type Direction, type FieldId, type RawInputs } from './logic/fields.ts';
import type { FieldErrors } from './logic/parseInputs.ts';
import { formatPercent } from './logic/format.ts';
import { BUNDESLAENDER, effectiveRate, type TaxState } from './logic/tax.ts';
import { TextField } from './TextField.tsx';
import styles from './PhaseForm.module.css';

export interface PhaseFormProps {
  readonly direction: Direction;
  readonly raw: RawInputs;
  /** Errors are shown only after the first edit (UX design §3). */
  readonly errors: FieldErrors;
  /** The tax checkboxes and the Bundesland (story 031); nothing here can be invalid. */
  readonly tax: TaxState;
  /** Story 046 AC1: the parking option is a checkbox, so it cannot hold a value outside its own options and
   * names no error; nothing in this block is ever disabled (024 AC3). */
  readonly parkOn: boolean;
  readonly onDirection: (direction: Direction) => void;
  readonly onField: (field: FieldId, value: string) => void;
  readonly onTax: (next: TaxState) => void;
  readonly onPark: (checked: boolean) => void;
}

/** The form whose accessible name is the visible `h2` "Eingaben", the sign-in probe (UX §1). */
export function PhaseForm({
  direction,
  raw,
  errors,
  tax,
  parkOn,
  onDirection,
  onField,
  onTax,
  onPark,
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

      {/* Story 045: the flat field is not rendered here but inside the tax block below, and story 046's rate
          field is rendered inside the parking block after it, so the Tab order follows the form order of
          `FIELD_IDS`, where the two percent fields are last (UX §1). */}
      {FIELD_IDS.filter((field) => field !== 'flatRate' && field !== 'depositRate').map((field) => (
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
          hint={TAX_COPY.kstHint(formatPercent(effectiveRate({ ...tax, kstOn: true })))}
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
        {/* Story 045 AC1: the field for the flat rate, the last control of the block. It is never disabled,
            like every other control of the form (024 AC3), and its copy says the rate counts only in the
            tax case. `field-flatRate` keeps the id pattern the other fields have. */}
        <TextField
          copy={FIELD_COPY.flatRate}
          inputId="field-flatRate"
          value={raw.flatRate}
          error={errors.flatRate}
          onChange={(value) => {
            onField('flatRate', value);
          }}
        />
      </fieldset>

      {/* Story 046 AC1 (hak's answer to Q5): the parking option is its own block, the last fieldset of the
          form, because it works outside the tax case too. The legend names the group and the label names what
          the control does, so they are two different strings; the whole row is one 44 px target and the hint
          is the control's description. The native checkbox is kept, not `role="switch"`: the platform has no
          switch component and the state change happens on a focused control that announces itself (UX §2). The
          rate field is never disabled, like every control of the form (024 AC3), and it is the last control of
          the block, which is what keeps the Tab order and the form order of `FIELD_IDS` one order. */}
      <fieldset className={styles.fieldset}>
        <legend>{DEPOSIT_COPY.legend}</legend>
        <CheckboxOption
          checked={parkOn}
          label={DEPOSIT_COPY.controlLabel}
          hint={DEPOSIT_COPY.controlHint}
          onChange={(checked) => {
            onPark(checked);
          }}
        />
        <TextField
          copy={FIELD_COPY.depositRate}
          inputId="field-depositRate"
          value={raw.depositRate}
          error={errors.depositRate}
          onChange={(value) => {
            onField('depositRate', value);
          }}
        />
      </fieldset>
    </form>
  );
}
