export type BoardView = '2d' | '3d';

/**
 * Cheap capability check at mount (story 008/AC7, 009/AC6): a CSS transform with perspective()
 * and rotateX() for the overlay, and the WebGL2 constructor for the scene. No context is created
 * here; a context that cannot be created later makes 3D unavailable then.
 */
export function supports3dView(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('transform', 'perspective(100px) rotateX(10deg)') &&
    typeof WebGL2RenderingContext !== 'undefined'
  );
}
