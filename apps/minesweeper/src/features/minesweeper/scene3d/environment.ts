import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  Vector3,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { ScenePalette } from './types.ts';

/** Brightness of the reflected window and the overhead panel relative to their light colours. */
const WINDOW_GAIN = 3;
const SKY_GAIN = 0.5;
/** Window direction: up and towards the far left, its right edge near the tops' mirror direction. */
const WINDOW_DIRECTION = new Vector3(-0.35, 0.45, 0.82).normalize();
const ROOM = 10;
const BLUR_SIGMA = 0.04;

/**
 * A small studio for the reflections of the hidden tiles (story 009, UX §3.3): a dim room in the
 * table colour, one large window in the key-light colour towards the far left and a soft panel
 * overhead. Mostly dark, so it adds a gloss gradient and bevel highlights without lifting the
 * diffuse light much (the calibration of UX §3.1 stays). Built in the board's z-up world.
 */
export function createEnvironment(renderer: WebGLRenderer, palette: ScenePalette): Texture {
  const { colours } = palette;
  const scene = new Scene();
  const room = new Mesh(
    new BoxGeometry(ROOM, ROOM, ROOM),
    new MeshBasicMaterial({ color: new Color(colours.table), side: BackSide }),
  );
  const pane = new Mesh(
    new PlaneGeometry(4, 2.5),
    new MeshBasicMaterial({
      color: new Color(colours.keyLight).multiplyScalar(WINDOW_GAIN),
      side: DoubleSide,
    }),
  );
  pane.position.copy(WINDOW_DIRECTION).multiplyScalar(ROOM / 2 - 0.2);
  pane.lookAt(0, 0, 0);
  const sky = new Mesh(
    new PlaneGeometry(6, 6),
    new MeshBasicMaterial({
      color: new Color(colours.fillSky).multiplyScalar(SKY_GAIN),
      side: DoubleSide,
    }),
  );
  sky.position.set(0, 0, ROOM / 2 - 0.1);
  scene.add(room, pane, sky);

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, BLUR_SIGMA).texture;
  pmrem.dispose();
  for (const mesh of [room, pane, sky]) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  return texture;
}
