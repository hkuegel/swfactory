export type BoardView = '2d' | '3d';

/** Cheap capability check: a transform with perspective() and rotateX(). Evaluated at mount. */
export function supports3dView(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('transform', 'perspective(100px) rotateX(10deg)')
  );
}
