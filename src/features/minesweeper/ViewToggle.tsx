import { useId } from 'react';
import type { BoardView } from './logic/boardView.ts';
import styles from './ViewToggle.module.css';

export interface ViewToggleProps {
  readonly view: BoardView;
  readonly onChange: (view: BoardView) => void;
  /** false: the "3D" option is disabled and the unavailable text is shown (AC7). */
  readonly available3d: boolean;
}

const OPTIONS: readonly { readonly value: BoardView; readonly label: string }[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

/**
 * The "View" choice (story 008): two native radios styled as a segmented control. Always
 * mounted, never disabled by game state. The change is announced by the focused radio itself,
 * so there is no live region.
 */
export function ViewToggle({ view, onChange, available3d }: ViewToggleProps) {
  const labelId = useId();
  const unavailableId = useId();
  const groupName = useId();

  return (
    <div className={styles.view}>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.group}>
        <span id={labelId} className={styles.label}>
          View
        </span>
        <div className={styles.segments}>
          {OPTIONS.map(({ value, label }) => {
            const unavailable = value === '3d' && !available3d;
            return (
              <label key={value} className={styles.segment}>
                <input
                  type="radio"
                  name={groupName}
                  className={styles.input}
                  checked={view === value}
                  disabled={unavailable}
                  aria-describedby={unavailable ? unavailableId : undefined}
                  onChange={() => onChange(value)}
                />
                <span className={styles.box}>
                  <svg
                    className={styles.check}
                    viewBox="0 0 16 16"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M3 8.5 6.5 12 13 4.5" />
                  </svg>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      {!available3d && (
        <p id={unavailableId} className={styles.unavailable}>
          3D is not available in this browser.
        </p>
      )}
    </div>
  );
}
