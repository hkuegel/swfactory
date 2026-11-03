import { useId, useLayoutEffect, useRef } from 'react';
import type { BoardView } from './logic/boardView.ts';
import { VIEW3D_TEXT, type View3dStatus } from './logic/view3d.ts';
import styles from './ViewToggle.module.css';

export interface ViewToggleProps {
  /** The requested view: the checked radio (story 009). */
  readonly requested: BoardView;
  /** 'loading': busy group and loading text; 'unavailable': "3D" disabled with a text (AC6). */
  readonly status3d: View3dStatus;
  readonly onChange: (view: BoardView) => void;
}

const OPTIONS: readonly { readonly value: BoardView; readonly label: string }[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

/**
 * The "View" choice (stories 008, 009): two native radios styled as a segmented control. Always
 * mounted, never disabled by game state. The change is announced by the focused radio itself;
 * loading and failures are announced by the game's live region (Minesweeper).
 */
export function ViewToggle({ requested, status3d, onChange }: ViewToggleProps) {
  const labelId = useId();
  const unavailableId = useId();
  const groupName = useId();
  const inputs = useRef<Partial<Record<BoardView, HTMLInputElement | null>>>({});
  const available3d = status3d !== 'unavailable';

  // UX §9: a focused "3D" that becomes disabled would drop focus to the body; move it to "2D".
  // Layout effect: before the browser's focus fixup for the now disabled radio.
  useLayoutEffect(() => {
    if (status3d === 'unavailable' && document.activeElement === inputs.current['3d']) {
      inputs.current['2d']?.focus();
    }
  }, [status3d]);

  return (
    <div className={styles.view}>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-busy={status3d === 'loading' ? true : undefined}
        className={styles.group}
      >
        <span id={labelId} className={styles.label}>
          View
        </span>
        <div className={styles.segments}>
          {OPTIONS.map(({ value, label }) => {
            const unavailable = value === '3d' && !available3d;
            return (
              <label key={value} className={styles.segment}>
                <input
                  ref={(element) => {
                    inputs.current[value] = element;
                  }}
                  type="radio"
                  name={groupName}
                  className={styles.input}
                  checked={requested === value}
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
      {/* Outside the busy group, so a screen reader does not skip it (UX §11). */}
      {status3d === 'loading' && <p className={styles.loading}>{VIEW3D_TEXT.loading}</p>}
      {!available3d && (
        <p id={unavailableId} className={styles.unavailable}>
          {VIEW3D_TEXT.unavailable}
        </p>
      )}
    </div>
  );
}
