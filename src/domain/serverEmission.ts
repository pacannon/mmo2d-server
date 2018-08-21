import { GameState } from './gameState';

export type ServerEmission =
  | FullUpdate

interface FullUpdate {
  kind: 'fullUpdate';
  gameState: GameState;
}