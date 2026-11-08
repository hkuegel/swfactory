import { useId, type FormEvent } from 'react';
import { CheckboxOption } from './CheckboxOption.tsx';
import { ALLOWANCE_COPY, REINVEST_COPY } from './fieldCopy.ts';
import { FIELD_IDS, type FieldId, type RawInputs } from './logic/fields.ts';
import type { FieldErrors } from './logic/parseInputs.ts';
import { TextField } from './TextField.tsx';
import styles from './InputForm.module.css';

export interface InputFormProps {
  readonly values: RawInputs;
  readonly errors: FieldErrors;
  readonly onChange: (field: FieldId, value: string) => void;
  /** Story 015: reinvest the tax refund (checkbox after the seven fields). */
  readonly reinvest: boolean;
  readonly onReinvestChange: (checked: boolean) => void;
  /** Story 016: the Sparer-Pauschbetrag of the ETF depot (last checkbox). */
  readonly allowance: boolean;
  readonly onAllowanceChange: (checked: boolean) => void;
}

/** The ETF comparison's field, rendered after the reinvest box (story 016, UX §1). */
const RETIREMENT_FIELD: FieldId = 'retirementRatePct';

function preventSubmit(event: FormEvent<HTMLFormElement>) {
  // No submit button: the result follows every keystroke. Enter must never reload the page.
  event.preventDefault();
}

/**
 * The seven labelled text inputs with hint and error (013/014 AC1, AC6, AC7), the reinvest
 * checkbox (015 AC1) in the free right cell of row 4, then the ETF comparison's group: sub-heading,
 * retirement rate and Pauschbetrag checkbox (016 AC1, AC10). DOM order = tab order.
 */
export function InputForm({
  values,
  errors,
  onChange,
  reinvest,
  onReinvestChange,
  allowance,
  onAllowanceChange,
}: InputFormProps) {
  const id = useId();
  const headingId = `${id}-heading`;
  const field = (fieldId: FieldId) => (
    <TextField
      key={fieldId}
      field={fieldId}
      inputId={`${id}-${fieldId}`}
      value={values[fieldId]}
      error={errors[fieldId]}
      onChange={onChange}
    />
  );
  return (
    <form className={styles.form} aria-labelledby={headingId} noValidate onSubmit={preventSubmit}>
      <h2 id={headingId}>Eingaben</h2>
      <div className={styles.fields}>
        {FIELD_IDS.filter((fieldId) => fieldId !== RETIREMENT_FIELD).map(field)}
        <CheckboxOption
          label={REINVEST_COPY.label}
          hint={REINVEST_COPY.hint}
          checked={reinvest}
          onChange={onReinvestChange}
        />
        <h3 className={styles.subheading}>Für den ETF-Vergleich</h3>
        {field(RETIREMENT_FIELD)}
        <CheckboxOption
          label={ALLOWANCE_COPY.label}
          hint={ALLOWANCE_COPY.hint}
          checked={allowance}
          onChange={onAllowanceChange}
        />
      </div>
    </form>
  );
}
