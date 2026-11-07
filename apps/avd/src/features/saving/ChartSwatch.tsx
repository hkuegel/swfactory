import styles from './BalanceChart.module.css';

export interface ChartSwatchProps {
  /** The series class of BalanceChart.module.css (fill and outline style). */
  readonly className?: string | undefined;
  /** A fill that is not a colour (the stripe pattern); colours come from the class. */
  readonly fill?: string | undefined;
}

/** 16 px legend sample with the same fill style as its chart series (story 013, UX §5). */
export function ChartSwatch({ className, fill }: ChartSwatchProps) {
  return (
    <svg className={styles.swatch} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <rect className={className} x="1" y="1" width="14" height="14" fill={fill} />
    </svg>
  );
}
