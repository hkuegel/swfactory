import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { toIndex, toRowCol } from './logic/grid.ts';

/** Touch: hold this long on a cell to toggle its flag (UX §4, AC6). */
export const LONG_PRESS_MS = 500;
/** Touch: moving farther than this cancels the long press and the tap (panning a large board). */
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;
/** Touch: the pressed overlay appears after this delay. */
const PRESSED_FEEDBACK_MS = 150;
const VIBRATE_MS = 10;

interface PendingPress {
  readonly index: number;
  readonly pointerId: number;
  readonly x: number;
  readonly y: number;
  readonly cell: HTMLElement;
  readonly feedbackTimer: number;
  readonly flagTimer: number;
}

export interface BoardInputOptions {
  readonly rows: number;
  readonly cols: number;
  /** Whether a long press on the cell should start (hidden or flagged cell, game not ended). */
  readonly isFlaggable: (index: number) => boolean;
  readonly onReveal: (index: number) => void;
  readonly onToggleFlag: (index: number) => void;
}

function cellOf(target: EventTarget): { index: number; cell: HTMLElement } | null {
  const cell = target instanceof Element ? target.closest<HTMLElement>('[data-index]') : null;
  const index = Number(cell?.dataset.index);
  return cell && Number.isInteger(index) ? { index, cell } : null;
}

/**
 * Board input (AC6, AC8): roving tabindex with arrow keys, Enter/Space reveal, F flag,
 * left click reveal, right click flag (mouse/pen), long press flag (touch). All handlers are
 * meant for the grid element (event delegation), so the memoized cells get no callbacks.
 */
export function useBoardInput({
  rows,
  cols,
  isFlaggable,
  onReveal,
  onToggleFlag,
}: BoardInputOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<PendingPress | null>(null);
  const suppressClickRef = useRef<number | null>(null);
  const pointerTypeRef = useRef('');

  const clearPressTimers = useCallback(() => {
    const press = pressRef.current;
    if (press) {
      window.clearTimeout(press.feedbackTimer);
      window.clearTimeout(press.flagTimer);
      pressRef.current = null;
    }
  }, []);

  const cancelPress = useCallback(() => {
    clearPressTimers();
    setPressedIndex(null);
  }, [clearPressTimers]);

  useEffect(() => clearPressTimers, [clearPressTimers]);

  const focusCell = useCallback((index: number) => {
    setActiveIndex(index);
    gridRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus();
  }, []);

  const onFocus = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const target = cellOf(event.target);
    if (target) setActiveIndex(target.index);
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const target = cellOf(event.target);
      if (!target) return;
      const { index } = target;
      const { row, col } = toRowCol(index, cols);
      const plain = !event.ctrlKey && !event.metaKey && !event.altKey;
      let next: number;
      switch (event.key) {
        case 'ArrowLeft':
          next = toIndex(row, Math.max(0, col - 1), cols);
          break;
        case 'ArrowRight':
          next = toIndex(row, Math.min(cols - 1, col + 1), cols);
          break;
        case 'ArrowUp':
          next = toIndex(Math.max(0, row - 1), col, cols);
          break;
        case 'ArrowDown':
          next = toIndex(Math.min(rows - 1, row + 1), col, cols);
          break;
        case 'Home':
          next = event.ctrlKey ? 0 : toIndex(row, 0, cols);
          break;
        case 'End':
          next = event.ctrlKey ? rows * cols - 1 : toIndex(row, cols - 1, cols);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault(); // Space must not scroll the page
          if (!event.repeat) onReveal(index);
          return;
        case 'f':
        case 'F':
          if (!plain) return; // leave Ctrl+F and other shortcuts to the browser
          event.preventDefault();
          if (!event.repeat) onToggleFlag(index);
          return;
        default:
          return;
      }
      if (event.altKey || event.metaKey) return; // e.g. Alt+Left is browser "back"
      event.preventDefault();
      focusCell(next);
    },
    [rows, cols, onReveal, onToggleFlag, focusCell],
  );

  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = cellOf(event.target);
      if (!target) return;
      if (suppressClickRef.current === target.index) {
        // The click that follows a long press or a cancelled tap must not reveal.
        suppressClickRef.current = null;
        return;
      }
      if (event.button !== 0) return;
      target.cell.focus();
      onReveal(target.index);
    },
    [onReveal],
  );

  const onContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      // Touch flags by the long-press timer only; Android also fires contextmenu then.
      if (pointerTypeRef.current !== 'mouse' && pointerTypeRef.current !== 'pen') return;
      const target = cellOf(event.target);
      if (target) onToggleFlag(target.index);
    },
    [onToggleFlag],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      pointerTypeRef.current = event.pointerType;
      suppressClickRef.current = null;
      cancelPress();
      if (event.pointerType !== 'touch') return;
      const target = cellOf(event.target);
      if (!target || !isFlaggable(target.index)) return;
      const { index, cell } = target;
      pressRef.current = {
        index,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cell,
        feedbackTimer: window.setTimeout(() => setPressedIndex(index), PRESSED_FEEDBACK_MS),
        flagTimer: window.setTimeout(() => {
          suppressClickRef.current = index;
          cancelPress();
          cell.focus({ preventScroll: true });
          onToggleFlag(index);
          if ('vibrate' in navigator) navigator.vibrate(VIBRATE_MS);
        }, LONG_PRESS_MS),
      };
    },
    [cancelPress, isFlaggable, onToggleFlag],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const press = pressRef.current;
      if (!press || press.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
      if (distance > LONG_PRESS_MOVE_TOLERANCE_PX) {
        suppressClickRef.current = press.index; // a drag is neither a tap nor a long press
        cancelPress();
      }
    },
    [cancelPress],
  );

  const onPointerEnd = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (pressRef.current?.pointerId === event.pointerId) cancelPress();
    },
    [cancelPress],
  );

  return {
    gridRef,
    activeIndex,
    pressedIndex,
    handlers: {
      onFocus,
      onKeyDown,
      onClick,
      onContextMenu,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
