import { describe, expect, it } from 'vitest';
import {
  initialView3d,
  view3dAnnouncement,
  view3dReducer,
  VIEW3D_TEXT,
  type View3dAction,
  type View3dState,
} from './view3d.ts';

function run(state: View3dState, ...actions: View3dAction[]): View3dState {
  return actions.reduce(view3dReducer, state);
}

const idle = initialView3d(true);
const choose3d: View3dAction = { type: 'choose', view: '3d', loaded: false };

describe('view3dReducer', () => {
  it('AC6: starts in 2D; unavailable at mount when 3D is not supported', () => {
    expect(idle).toMatchObject({ requested: '2d', shown: '2d', status: 'idle', notice: null });
    expect(initialView3d(false).status).toBe('unavailable');
    expect(run(initialView3d(false), choose3d).requested).toBe('2d');
  });

  it('AC4: choosing 3D with a live controller switches at once', () => {
    const state = run(idle, { type: 'choose', view: '3d', loaded: true });
    expect(state).toMatchObject({ requested: '3d', shown: '3d', status: 'idle', attempt: 0 });
  });

  it('AC6: choosing 3D for the first time starts a load attempt and clears the notice', () => {
    const failed = { ...idle, notice: 'loadFailed' as const };
    const state = run(failed, choose3d);
    expect(state).toMatchObject({
      requested: '3d',
      shown: '2d',
      status: 'loading',
      notice: null,
      attempt: 1,
    });
    // Choosing 3D again while loading does not start a second attempt.
    expect(run(state, choose3d).attempt).toBe(1);
  });

  it('AC6: ready of the current attempt shows 3D', () => {
    const state = run(idle, choose3d, { type: 'ready', attempt: 1 });
    expect(state).toMatchObject({ requested: '3d', shown: '3d', status: 'idle' });
  });

  it('AC6: choosing 2D during loading cancels it; a late ready does not switch', () => {
    const state = run(idle, choose3d, { type: 'choose', view: '2d', loaded: false });
    expect(state).toMatchObject({ requested: '2d', shown: '2d', status: 'idle' });
    expect(run(state, { type: 'ready', attempt: 1 })).toBe(state);
  });

  it('AC6: a failed or timed-out load returns to 2D with a notice; a late ready is ignored', () => {
    const failed = run(idle, choose3d, { type: 'loadFailed', attempt: 1 });
    expect(failed).toMatchObject({
      requested: '2d',
      shown: '2d',
      status: 'idle',
      notice: 'loadFailed',
    });
    expect(run(failed, { type: 'ready', attempt: 1 })).toBe(failed);
    // A stale failure of an older attempt does not cancel a newer load.
    const retry = run(failed, choose3d);
    expect(run(retry, { type: 'loadFailed', attempt: 1 })).toBe(retry);
  });

  it('AC6: no context makes 3D unavailable for the mount, with the load notice', () => {
    const state = run(idle, choose3d, { type: 'unavailable' });
    expect(state).toMatchObject({
      requested: '2d',
      shown: '2d',
      status: 'unavailable',
      notice: 'loadFailed',
    });
    expect(run(state, choose3d)).toBe(state);
  });

  it('AC6: a lost context returns to 2D with a notice; choosing 3D again loads anew', () => {
    const shown = run(idle, choose3d, { type: 'ready', attempt: 1 });
    const lost = run(shown, { type: 'lost' });
    expect(lost).toMatchObject({ requested: '2d', shown: '2d', notice: 'lost' });
    expect(run(lost, choose3d)).toMatchObject({ status: 'loading', notice: null, attempt: 2 });
    // Lost while 2D is shown: nothing to tell.
    const in2d = run(shown, { type: 'choose', view: '2d', loaded: true });
    expect(run(in2d, { type: 'lost' })).toBe(in2d);
  });
});

describe('view3dAnnouncement', () => {
  const seen = { status: 'idle', notice: null, ready: false } as const;

  it('AC6: announces loading, ready after a load and each new notice, not an instant switch', () => {
    expect(view3dAnnouncement(seen, { ...seen, status: 'loading' })).toBe(VIEW3D_TEXT.loading);
    expect(view3dAnnouncement({ ...seen, status: 'loading' }, { ...seen, ready: true })).toBe(
      VIEW3D_TEXT.ready,
    );
    expect(
      view3dAnnouncement({ ...seen, status: 'loading' }, { ...seen, notice: 'loadFailed' }),
    ).toBe(VIEW3D_TEXT.loadFailed);
    expect(view3dAnnouncement({ ...seen, ready: true }, { ...seen, notice: 'lost' })).toBe(
      VIEW3D_TEXT.lost,
    );
    expect(view3dAnnouncement(seen, { ...seen, ready: true })).toBeNull();
  });
});
