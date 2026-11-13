import { useCallback, useMemo, useState } from 'react';
import { COPY, fieldLabel, firstInvalidField, invalidLiveText, liveText } from './fieldCopy.ts';
import { FundTable } from './FundTable.tsx';
import { PhaseForm } from './PhaseForm.tsx';
import { ResultSummary } from './ResultSummary.tsx';
import { YearTable } from './YearTable.tsx';
import { useSettledValue } from './useSettledValue.ts';
import {
  OVERRIDE_SPECS,
  fieldSpec,
  type Direction,
  type FieldId,
  type OverrideField,
  type RawInputs,
} from './logic/fields.ts';
import { FUND_LIST, FUND_LIST_AS_OF, effectiveFund, type FundOverride } from './logic/fund.ts';
import { formatEuro } from './logic/format.ts';
import { parseField, parseInputs, type FieldError, type FieldErrors } from './logic/parseInputs.ts';
import { buildPlan, type Phase, type Plan } from './logic/phase.ts';
import { payoutPerShareMicroEur, type Tax } from './logic/projection.ts';
import styles from './PlanCalculator.module.css';

/** The live region speaks only after typing has paused this long (UX §4). */
const LIVE_REGION_DELAY_MS = 700;

/** The empty first render: nothing typed, direction 1, tax off (UX §3). */
const EMPTY_INPUTS: RawInputs = { phaseStart: '', phaseEnd: '', amount: '', taxRate: '' };

type OverrideTexts = ReadonlyMap<number, Readonly<Partial<Record<OverrideField, string>>>>;

/** Everything the components read is derived here; nothing is stored (C3). */
interface Derived {
  readonly errors: FieldErrors;
  /** The parsed phase, or null while a phase field is not usable. */
  readonly phase: Phase | null;
  /** The plan, or null while a field is invalid. */
  readonly plan: Plan | null;
  /** Fund year → projection in cents, from the effective (possibly overridden) fund. */
  readonly projections: ReadonlyMap<number, number>;
  /** One error per invalid override cell; an empty cell is not an error (UX §3). */
  readonly overrideErrors: ReadonlyMap<
    number,
    Readonly<Partial<Record<OverrideField, FieldError>>>
  >;
  /** A cell is marked only when its parsed value differs from the data file (AC5). */
  readonly markers: ReadonlyMap<number, Readonly<Partial<Record<OverrideField, boolean>>>>;
  /** The phase has no year with a funding fund, so there is no result (risk 4). */
  readonly noFundingYear: boolean;
  /** The tax the calculation uses, as far as the rate can be parsed. */
  readonly tax: Tax;
}

/**
 * Payout phase calculator (story 024): owns the raw field texts, the direction, the tax checkbox,
 * the `edited` flag and the override texts. Parsing, plan, projections, override errors and markers
 * are derived in one `useMemo`; only the live region is debounced (UX §4).
 */
export function PlanCalculator() {
  const [raw, setRaw] = useState<RawInputs>(EMPTY_INPUTS);
  const [direction, setDirection] = useState<Direction>('depot');
  const [taxOn, setTaxOn] = useState(false);
  // The first render is not announced and shows no error (UX §3).
  const [edited, setEdited] = useState(false);
  // The override state lives here, so FundTable stays presentational.
  const [overrides, setOverrides] = useState<OverrideTexts>(new Map());

  const derived: Derived = useMemo(() => {
    const parsed = parseInputs(raw, taxOn);
    const errors = parsed.ok ? {} : parsed.errors;
    // The rate is read only while the checkbox is checked; while it cannot be parsed it is 0.
    const rate = taxOn ? parseField(fieldSpec('taxRate'), raw.taxRate) : null;
    const tax: Tax = { on: taxOn, rateBp: rate !== null && rate.ok ? rate.value : 0 };

    const projections = new Map<number, number>();
    const overrideErrors = new Map<number, Partial<Record<OverrideField, FieldError>>>();
    const markers = new Map<number, Partial<Record<OverrideField, boolean>>>();

    const funds = FUND_LIST.map((fund) => {
      const typed = overrides.get(fund.year) ?? {};
      const values: FundOverride = {};
      const rowErrors: Partial<Record<OverrideField, FieldError>> = {};
      const rowMarkers: Partial<Record<OverrideField, boolean>> = {};
      for (const field of ['nav', 'ytm'] as const) {
        const text = typed[field];
        if (text === undefined || text.trim() === '') continue;
        const result = parseField(OVERRIDE_SPECS[field], text);
        if (!result.ok) {
          // An invalid cell shows its error; the calculation keeps the value of the data file.
          rowErrors[field] = result.error;
          continue;
        }
        if (field === 'nav') values.navMicroEur = result.value;
        else values.ytmBp = result.value;
        rowMarkers[field] = result.value !== (field === 'nav' ? fund.navMicroEur : fund.ytmBp);
      }
      if (Object.keys(rowErrors).length > 0) overrideErrors.set(fund.year, rowErrors);
      if (Object.keys(rowMarkers).length > 0) markers.set(fund.year, rowMarkers);
      return effectiveFund(fund, values);
    });

    const phase = parsed.ok
      ? { startMonth: parsed.inputs.phaseStart, endMonth: parsed.inputs.phaseEnd }
      : null;
    const plan =
      parsed.ok && phase !== null
        ? buildPlan(funds, phase, tax, parsed.inputs.amountCents, direction)
        : null;

    for (const fund of funds) projections.set(fund.year, payoutPerShareMicroEur(fund, tax));

    return {
      errors,
      phase,
      plan,
      projections,
      overrideErrors,
      markers,
      noFundingYear: plan !== null && plan.fundedYears.length === 0,
      tax,
    };
  }, [raw, direction, taxOn, overrides]);

  const firstInvalid = firstInvalidField(derived.errors);
  const invalid = firstInvalid !== undefined;
  const liveTextValue = !edited
    ? ''
    : derived.plan !== null && !derived.noFundingYear
      ? liveText(
          direction,
          formatEuro(derived.plan.monthlyCents),
          formatEuro(derived.plan.totalCents),
        )
      : invalid
        ? invalidLiveText(fieldLabel(firstInvalid, direction))
        : COPY.noFundingYear;
  const settledLiveText = useSettledValue(liveTextValue, LIVE_REGION_DELAY_MS);

  function handleField(field: FieldId, value: string) {
    setRaw((previous) => ({ ...previous, [field]: value }));
    setEdited(true);
  }

  function handleDirection(next: Direction) {
    setDirection(next);
    setEdited(true);
  }

  function handleTax(checked: boolean) {
    setTaxOn(checked);
    setEdited(true);
  }

  // A small updater: the parsed value and the marker are derived, never stored (C3).
  const handleOverride = useCallback((field: OverrideField, year: number, value: string) => {
    setOverrides((previous) => {
      const row = new Map(previous);
      row.set(year, { ...previous.get(year), [field]: value });
      return row;
    });
    setEdited(true);
  }, []);

  return (
    <div className={styles.panel}>
      {/* No field error before the first edit (UX design §3). */}
      <PhaseForm
        direction={direction}
        raw={raw}
        errors={edited ? derived.errors : {}}
        taxOn={taxOn}
        onDirection={handleDirection}
        onField={handleField}
        onTax={handleTax}
      />
      <ResultSummary
        plan={derived.plan}
        invalid={invalid}
        edited={edited}
        noFundingYear={derived.noFundingYear}
        direction={direction}
        liveText={settledLiveText}
      />
      {/* The year table is removed while any field is invalid (UX §3), and a phase year without a
         funding fund keeps its row with the missing-year line (AC2). */}
      {derived.plan !== null && derived.phase !== null && (
        <YearTable plan={derived.plan} phase={derived.phase} />
      )}
      {/* The Fondsplan stays while a field is invalid (UX §3). */}
      <FundTable
        fundList={FUND_LIST}
        projections={derived.projections}
        overrides={overrides}
        errors={derived.overrideErrors}
        markers={derived.markers}
        asOf={FUND_LIST_AS_OF}
        onOverrideChange={handleOverride}
      />
    </div>
  );
}
