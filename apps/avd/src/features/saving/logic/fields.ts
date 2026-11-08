/** The eight text inputs of the calculator, in the order of the form. */
export type FieldId =
  | 'age'
  | 'payoutAge'
  | 'monthly'
  | 'children'
  | 'returnPct'
  | 'costsPct'
  | 'taxRatePct'
  | 'retirementRatePct';

/** The raw text of every field, exactly as typed. */
export type RawInputs = Readonly<Record<FieldId, string>>;

export interface FieldSpec {
  /** Limits in the field's integer unit: years, children, cents, basis points (1 % = 100). */
  readonly min: number;
  readonly max: number;
  /** 0: whole numbers only; 2: up to two decimals (cents, hundredths of a percent). */
  readonly decimals: 0 | 2;
  /** Shown in the input on load. */
  readonly defaultValue: string;
}

/** Form order; also the order in which the first invalid field is named. */
export const FIELD_IDS: readonly FieldId[] = [
  'age',
  'payoutAge',
  'monthly',
  'children',
  'returnPct',
  'costsPct',
  'taxRatePct',
  'retirementRatePct',
];

/** Single source of the ranges and defaults (story 013 Context; tax rate: 014; retirement rate: 016). */
export const FIELD_SPECS: Readonly<Record<FieldId, FieldSpec>> = {
  age: { min: 18, max: 69, decimals: 0, defaultValue: '40' },
  payoutAge: { min: 65, max: 70, decimals: 0, defaultValue: '65' },
  monthly: { min: 0, max: 57000, decimals: 2, defaultValue: '150' },
  children: { min: 0, max: 10, decimals: 0, defaultValue: '0' },
  returnPct: { min: -1000, max: 2000, decimals: 2, defaultValue: '5' },
  costsPct: { min: 0, max: 100, decimals: 2, defaultValue: '0,5' },
  taxRatePct: { min: 0, max: 5000, decimals: 2, defaultValue: '30' },
  retirementRatePct: { min: 0, max: 5000, decimals: 2, defaultValue: '20' },
};

export const DEFAULT_INPUTS: RawInputs = {
  age: FIELD_SPECS.age.defaultValue,
  payoutAge: FIELD_SPECS.payoutAge.defaultValue,
  monthly: FIELD_SPECS.monthly.defaultValue,
  children: FIELD_SPECS.children.defaultValue,
  returnPct: FIELD_SPECS.returnPct.defaultValue,
  costsPct: FIELD_SPECS.costsPct.defaultValue,
  taxRatePct: FIELD_SPECS.taxRatePct.defaultValue,
  retirementRatePct: FIELD_SPECS.retirementRatePct.defaultValue,
};
