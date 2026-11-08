import { useState } from 'react';
import { BalanceChart } from './BalanceChart.tsx';
import { liveSentence } from './comparisonCopy.ts';
import { DepotComparison } from './DepotComparison.tsx';
import { FIELD_COPY, firstInvalidField } from './fieldCopy.ts';
import { InputForm } from './InputForm.tsx';
import { DEFAULT_INPUTS, type FieldId, type RawInputs } from './logic/fields.ts';
import { formatEuro } from './logic/format.ts';
import { compareDepots } from './logic/compare.ts';
import { parseInputs } from './logic/parseInputs.ts';
import { project } from './logic/project.ts';
import { taxRefund } from './logic/taxRefund.ts';
import { ResultSummary } from './ResultSummary.tsx';
import { useSettledValue } from './useSettledValue.ts';
import { YearTable } from './YearTable.tsx';
import styles from './SavingCalculator.module.css';

/** The live region speaks only after typing has paused this long (UX §4). */
const LIVE_REGION_DELAY_MS = 700;

/**
 * Saving phase calculator (stories 013, 014, 015) with the ETF comparison (016): owns the eight
 * raw input texts and the two checkboxes; validation, projection, tax refund, comparison, table,
 * chart and live text are derived on every render.
 */
export function SavingCalculator() {
  const [values, setValues] = useState<RawInputs>(DEFAULT_INPUTS);
  // The default result on load is not announced; the live region speaks after the first edit.
  const [edited, setEdited] = useState(false);
  // Outside the text fields, so an invalid field never touches it (015 AC5); unchecked = 014.
  const [reinvest, setReinvest] = useState(false);
  // Story 016 AC12: the ETF depot's Sparer-Pauschbetrag; read only by the ETF side.
  const [allowance, setAllowance] = useState(true);

  const parsed = parseInputs(values);
  const projection = parsed.ok ? project(parsed.inputs, { reinvestRefund: reinvest }) : null;
  // Reads c and Z of every year from the projection's schedule (ADR 0008).
  const refund = parsed.ok && projection !== null ? taxRefund(parsed.inputs, projection) : null;
  // Reads the projection and refund above; neither feeds back into them (ADR 0009).
  const comparison =
    parsed.ok && projection !== null && refund !== null
      ? compareDepots(parsed.inputs, projection, refund, { useAllowance: allowance })
      : null;
  const payoutAge = parsed.ok ? parsed.inputs.payoutAge : null;
  const errors = parsed.ok ? {} : parsed.errors;

  let liveText = '';
  if (edited) {
    if (projection !== null && refund !== null && comparison !== null && payoutAge !== null) {
      liveText = `Endwert bei Auszahlungsbeginn mit ${String(payoutAge)}: ${formatEuro(projection.total.balanceCents)}. Steuererstattung gesamt: ${formatEuro(refund.totalCents)}.`;
      if (reinvest) {
        liveText += ` Davon wieder angelegt: ${formatEuro(projection.total.reinvestedCents)}.`;
      }
      liveText += ` ${liveSentence(comparison.differenceCents)}`;
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

  function handleReinvestChange(checked: boolean) {
    setReinvest(checked);
    setEdited(true);
  }

  function handleAllowanceChange(checked: boolean) {
    setAllowance(checked);
    setEdited(true);
  }

  return (
    <div className={styles.panel}>
      <InputForm
        values={values}
        errors={errors}
        onChange={handleChange}
        reinvest={reinvest}
        onReinvestChange={handleReinvestChange}
        allowance={allowance}
        onAllowanceChange={handleAllowanceChange}
      />
      <ResultSummary
        projection={projection}
        refund={refund}
        payoutAge={payoutAge}
        liveText={settledLiveText}
        reinvest={reinvest}
      />
      {comparison !== null && payoutAge !== null && (
        <DepotComparison comparison={comparison} payoutAge={payoutAge} allowance={allowance} />
      )}
      {projection !== null && refund !== null && payoutAge !== null && (
        <>
          <BalanceChart rows={projection.years} payoutAge={payoutAge} reinvest={reinvest} />
          <YearTable
            rows={projection.years}
            refundsCents={refund.byYearCents}
            reinvest={reinvest}
          />
        </>
      )}
    </div>
  );
}
