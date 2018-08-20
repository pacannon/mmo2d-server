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

export const update = (gameState: GameState, delta: number, actionQueue: WorldAction[]): GameState => {
  actionQueue = [...actionQueue];
  const oldWorld = JSON.stringify(gameState.world);
  const dirtyTick = gameState.tick + 1;

  let dirtyWorld = gameState.world;
  let dirtyWorldActions: undefined | WorldAction[] = undefined;

  if (actionQueue.length > 0) {
    dirtyWorldActions = [];

    while (actionQueue.length > 0) {
      const action = actionQueue[0];
      actionQueue.shift();

      console.log('===PROCESSING ACTION===');
      console.log(JSON.stringify(action));
      console.log();
  
      console.group();
  
      dirtyWorld = reduce(action, dirtyWorld);
      dirtyWorldActions.push(action);
  
      const newWorld = JSON.stringify(dirtyWorld);
    
      if (newWorld === oldWorld) {
        console.log('\x1b[41m%s\x1b[0m', 'no change detected')
      } else {
        console.log('\x1b[32m%s\x1b[0m', 'world modified')
      }
      console.groupEnd();
      console.log('===DONE PROCESSING ACTION===');
      console.log();
    }
  
    const newWorld = JSON.stringify(gameState.world);
  
    if (newWorld !== oldWorld) {
      console.log(JSON.stringify(gameState));
    }
  }

  let newWorldActions = { ...gameState.worldActions };

  if (dirtyWorldActions !== undefined) {
    newWorldActions = {
      ...newWorldActions,
      [dirtyTick]: [...dirtyWorldActions],
    };
  }
  
  const newGameState: GameState = {
    tick: dirtyTick,
    world: dirtyWorld,
    worldActions: newWorldActions
  }

  return newGameState;
}