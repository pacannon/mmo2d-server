import { World, WorldAction, reduce } from './world';

export type GameState = {
  tick: number;
  world: World;
  worldActions: { [tick: number]: WorldAction[] };
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

export const update = (gameState: GameState, actionQueue: WorldAction[]): GameState => {
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
  
      dirtyWorld = reduce(action)(dirtyWorld);
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