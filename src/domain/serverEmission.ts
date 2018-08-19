import { World } from './world';
import { GameStateDelta } from './gameState';

export type ServerEmission =
  | FullUpdate
  | GameStateDeltaEmission

interface FullUpdate {
  kind: 'fullUpdate';
  tick: number;
  world: World;
}

interface GameStateDeltaEmission {
  kind: 'gameStateDeltaEmission';
  tick: number;
  gsd: GameStateDelta;
}