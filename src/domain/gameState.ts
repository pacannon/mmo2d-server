import { World, WorldAction, reduce } from './world';
import { PlayerDisplacement } from './player';
import { UserCommand } from '../index';

export const TICKRATE = 15;

export type GameState = {
  tick: number;
  world: World;
  worldActions: { [tick: number]: GameStateDelta[] };
}

export const GameState = (
  tick: number = 0,
  world: World = World (),
  worldActions: { [tick: number]: WorldAction[] } = {}
): GameState => {
  return {
    tick,
    world,
    worldActions,
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