import styles from './BalanceChart.module.css';

export interface ChartSwatchProps {
  /** The series class of BalanceChart.module.css (fill and outline in both modes). */
  readonly className?: string | undefined;
}

/** 16 px legend sample with the same fill style as its chart series (story 013, UX §5; 017). */
export function ChartSwatch({ className }: ChartSwatchProps) {
  return (
    <svg className={styles.swatch} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <rect className={className} x="1" y="1" width="14" height="14" />
    </svg>
  );
}
