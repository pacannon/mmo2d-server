import { World, WorldAction } from './world';

export type ServerEmission =
  | FullUpdate
  | GameStateDelta

interface FullUpdate {
  kind: 'fullUpdate';
  tick: number;
  world: World;
}

interface GameStateDelta {
  kind: 'gameStateDelta';
  tick: number;
  worldAction: WorldAction;
}