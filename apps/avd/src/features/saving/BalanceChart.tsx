import { useId, type CSSProperties } from 'react';
import { chartGeometry, xAxisYears, type Segment } from './logic/chartGeometry.ts';
import { formatEuro, formatWholeEuro } from './logic/format.ts';
import type { YearRow } from './logic/project.ts';
import { ChartSwatch as Swatch } from './ChartSwatch.tsx';
import styles from './BalanceChart.module.css';

export interface BalanceChartProps {
  /** At least one row (a valid projection). */
  readonly rows: readonly YearRow[];
  readonly payoutAge: number;
  /** Story 015: draw the reinvested refund as a fourth series with its legend entry. */
  readonly reinvest: boolean;
}

/** A single bar keeps the width of one of eight slots instead of stretching (UX §5). */
const MIN_SLOTS = 8;
/** Gap between bars as a fraction of a slot. */
const BAR_GAP = 0.2;
/** Most x labels below and from 600 px (UX §5). */
const MAX_X_LABELS_NARROW = 8;
const MAX_X_LABELS_WIDE = 12;
/** Forced colours only (story 017): stripe period of the Zulagen pattern in units of the
 *  100-unit plot height (50 % stripe). */
const STRIPE_PERIOD = 4;
/** Forced colours only (story 017): heavy stripes of the reinvested refund (story 015, UX §5):
 *  period 8, 75 % stripe. */
const HEAVY_STRIPE_PERIOD = 8;
const HEAVY_STRIPE_SHARE = 0.75;

function segmentClass(segment: Segment): string | undefined {
  if (segment.loss) return styles.loss;
  return styles[segment.series];
}

/** The pattern URLs for the forced-colours rules of BalanceChart.module.css (story 017). */
type PatternVars = CSSProperties & Record<'--zulagen-stripes' | '--reinvested-stripes', string>;

function percent(fraction: number): string {
  return `${String(fraction * 100)}%`;
}

/** Stacked bars of the balance per saving year (AC5), with a text alternative. */
export function BalanceChart({ rows, payoutAge, reinvest }: BalanceChartProps) {
  const id = useId();
  // useId may contain characters that are awkward in url(#…); the chart is once per page.
  const safeId = id.replace(/[^\w-]/g, '');
  const patternId = `zulagen-stripes-${safeId}`;
  const heavyPatternId = `reinvested-stripes-${safeId}`;
  const headingId = `${id}-heading`;
  // CSS picks colour (normal view) or pattern (forced colours); only the id comes from React.
  const patternVars: PatternVars = {
    '--zulagen-stripes': `url(#${patternId})`,
    '--reinvested-stripes': `url(#${heavyPatternId})`,
  };

  const { bars, ticks } = chartGeometry(rows);
  const total = rows[rows.length - 1];
  if (total === undefined) return null;
  const topTick = ticks[ticks.length - 1]?.cents ?? 0;
  const slotCount = Math.max(rows.length, MIN_SLOTS);
  const slot = 100 / slotCount;
  const hasLoss = rows.some((row) => row.returnsCents < 0);
  const isEmpty = bars.every((bar) => bar.segments.length === 0);
  const narrowYears = new Set(xAxisYears(rows.length, MAX_X_LABELS_NARROW));
  const wideYears = new Set(xAxisYears(rows.length, MAX_X_LABELS_WIDE));
  const labelYears = [...new Set([...narrowYears, ...wideYears])].sort((a, b) => a - b);

  const label =
    `Gestapeltes Säulendiagramm: Kontostand pro Sparjahr bis zum Auszahlungsbeginn mit ` +
    `${String(payoutAge)}, Endwert ${formatEuro(total.balanceCents)}. ` +
    `Davon eigene Beiträge ${formatEuro(total.contributionsCents)}, ` +
    `Zulagen ${formatEuro(total.zulagenCents)}, ` +
    (reinvest ? `reinvestierte Steuererstattung ${formatEuro(total.reinvestedCents)}, ` : '') +
    `Erträge ${formatEuro(total.returnsCents)}. ` +
    `Genaue Werte pro Jahr in der Jahrestabelle.`;

  return (
    <section className={styles.section} aria-labelledby={headingId} style={patternVars}>
      <h2 id={headingId}>Verlauf des Kontostands</h2>
      <ul className={styles.legend}>
        <li>
          <Swatch className={styles.contributions} />
          Eigene Beiträge
        </li>
        <li>
          {/* framed: forced colours only */}
          <Swatch className={`${styles.zulagen} ${styles.framed}`} />
          Zulagen
        </li>
        {reinvest && (
          <li>
            <Swatch className={styles.reinvested} />
            Reinvestierte Steuererstattung
          </li>
        )}
        <li>
          <Swatch className={styles.returns} />
          Erträge
        </li>
        {hasLoss && (
          <li>
            <Swatch className={styles.loss} />
            Verlust (negative Erträge)
          </li>
        )}
      </ul>
      <div className={styles.chart} role="img" aria-label={label}>
        <div className={styles.yAxis} aria-hidden="true">
          {/* Invisible copy of the widest label: sizes the axis column, so no label spills out. */}
          <span className={styles.ySizer}>{formatWholeEuro(topTick)}</span>
          {ticks.map((tick) => (
            <span key={tick.cents} className={styles.yLabel} style={{ bottom: percent(tick.at) }}>
              {formatWholeEuro(tick.cents)}
            </span>
          ))}
        </div>
        <div className={styles.plot} aria-hidden="true">
          <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern
                id={patternId}
                patternUnits="userSpaceOnUse"
                width="100"
                height={STRIPE_PERIOD}
              >
                <rect className={styles.stripeGap} width="100" height={STRIPE_PERIOD} />
                <rect className={styles.stripe} width="100" height={STRIPE_PERIOD / 2} />
              </pattern>
              {reinvest && (
                <pattern
                  id={heavyPatternId}
                  patternUnits="userSpaceOnUse"
                  width="100"
                  height={HEAVY_STRIPE_PERIOD}
                >
                  <rect className={styles.stripeGap} width="100" height={HEAVY_STRIPE_PERIOD} />
                  <rect
                    className={styles.heavyStripe}
                    width="100"
                    height={HEAVY_STRIPE_PERIOD * HEAVY_STRIPE_SHARE}
                  />
                </pattern>
              )}
            </defs>
            {ticks
              .filter((tick) => tick.at > 0)
              .map((tick) => (
                <line
                  key={tick.cents}
                  className={styles.grid}
                  x1="0"
                  x2="100"
                  y1={100 - tick.at * 100}
                  y2={100 - tick.at * 100}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {bars.map((bar, index) =>
              bar.segments.map((segment) => (
                <rect
                  key={`${String(bar.year)}-${segment.series}`}
                  className={segmentClass(segment)}
                  x={(index + BAR_GAP / 2) * slot}
                  width={(1 - BAR_GAP) * slot}
                  y={100 - segment.to * 100}
                  height={(segment.to - segment.from) * 100}
                  vectorEffect="non-scaling-stroke"
                />
              )),
            )}
            <line
              className={styles.baseline}
              x1="0"
              x2="100"
              y1="100"
              y2="100"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {isEmpty && <p className={styles.empty}>Ohne Beitrag entsteht kein Kontostand.</p>}
        </div>
        <div className={styles.xAxis} aria-hidden="true">
          {labelYears.map((year) => {
            const style: CSSProperties = { left: percent((year - 0.5) / slotCount) };
            const visibility = narrowYears.has(year)
              ? wideYears.has(year)
                ? undefined
                : styles.narrowOnly
              : styles.wideOnly;
            return (
              <span
                key={year}
                className={
                  visibility === undefined ? styles.xLabel : `${styles.xLabel} ${visibility}`
                }
                style={style}
              >
                {year}
              </span>
            );
          })}
        </div>
        <div className={styles.xTitle} aria-hidden="true">
          Sparjahr
        </div>
      </div>
    </section>
  );
}
