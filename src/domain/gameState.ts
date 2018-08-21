import { World } from './world';
import { PlayerDisplacement } from './player';
import { UserCommand } from '../index';

export const TICKRATE_MS = 15;
export const EXPIRE_AFTER_MS = 1000;

export type GameState = {
  tick: number;
  world: World;
  deltas: GameStateDelta[];
}

export const GameState = (
  tick: number = 0,
  world: World = World (),
  deltas: GameStateDelta[] = []
): GameState => {
  return {
    tick,
    world,
    deltas,
  }
}

export type GameStateDelta = PlayerDisplacement | UserCommand;

export const processUserCommand = (userCommand: UserCommand): GameStateDelta[] => {
  switch (userCommand.kind) {
    case 'world.addPlayer':
    case 'world.players.filterOut':
    case 'player.controllerAction':
      const retVal: GameStateDelta[] = [userCommand];
        return retVal;
    default:
      const _exhaustiveCheck: never = userCommand;
      return _exhaustiveCheck;
  }
};

export const processUserCommands = (userCommands: UserCommand[]): GameStateDelta[] => {
  const deltas = userCommands.map(processUserCommand).reduce((a, b) => [...a, ...b], []);
  
  return deltas;
};