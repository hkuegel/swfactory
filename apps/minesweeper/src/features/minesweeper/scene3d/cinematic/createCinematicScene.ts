import { createBoardScene } from '../createBoardScene.ts';
import type { BoardSceneController, CreateBoardSceneOptions } from '../types.ts';
import { createCinematicRig } from './cinematicRig.ts';

/**
 * The lazy entry of the cinematic view (story 050): the board scene of createBoardScene.ts with
 * the cinematic rig plugged in. Throws what createBoardScene throws (the hook compares the name).
 */
export function createCinematicScene(options: CreateBoardSceneOptions): BoardSceneController {
  return createBoardScene(options, [], createCinematicRig);
}
