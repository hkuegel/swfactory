import { useState } from 'react';
import { BalanceChart } from './BalanceChart.tsx';
import { FIELD_COPY, firstInvalidField } from './fieldCopy.ts';
import { InputForm } from './InputForm.tsx';
import { DEFAULT_INPUTS, type FieldId, type RawInputs } from './logic/fields.ts';
import { formatEuro } from './logic/format.ts';
import { parseInputs } from './logic/parseInputs.ts';
import { project } from './logic/project.ts';
import { ResultSummary } from './ResultSummary.tsx';
import { useSettledValue } from './useSettledValue.ts';
import { YearTable } from './YearTable.tsx';
import styles from './SavingCalculator.module.css';

/** The live region speaks only after typing has paused this long (UX §4). */
const LIVE_REGION_DELAY_MS = 700;

/**
 * Saving phase calculator (story 013): owns the six raw input texts; validation, projection,
 * table, chart and live text are derived on every render.
 */
export function SavingCalculator() {
  const [values, setValues] = useState<RawInputs>(DEFAULT_INPUTS);
  // The default result on load is not announced; the live region speaks after the first edit.
  const [edited, setEdited] = useState(false);

  const parsed = parseInputs(values);
  const projection = parsed.ok ? project(parsed.inputs) : null;
  const payoutAge = parsed.ok ? parsed.inputs.payoutAge : null;
  const errors = parsed.ok ? {} : parsed.errors;

  let liveText = '';
  if (edited) {
    if (projection !== null && payoutAge !== null) {
      liveText = `Endwert bei Auszahlungsbeginn mit ${String(payoutAge)}: ${formatEuro(projection.total.balanceCents)}.`;
    } else {
      const field = firstInvalidField(errors);
      if (field !== undefined) liveText = `Kein Ergebnis: ${FIELD_COPY[field].label} ist ungültig.`;
    }
  }
  const settledLiveText = useSettledValue(liveText, LIVE_REGION_DELAY_MS);

  function handleChange(field: FieldId, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setEdited(true);
  }

  return (
    <div className={styles.panel}>
      <InputForm values={values} errors={errors} onChange={handleChange} />
      <ResultSummary projection={projection} payoutAge={payoutAge} liveText={settledLiveText} />
      {projection !== null && payoutAge !== null && (
        <>
          <BalanceChart rows={projection.years} payoutAge={payoutAge} />
          <YearTable rows={projection.years} />
        </>
      )}
    </div>
  );
}
