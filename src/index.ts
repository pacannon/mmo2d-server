import { performance } from 'perf_hooks';

import * as World from './domain/world';
import * as GameState from './domain/gameState';
import * as SocketService from './domain/socketService';
import * as Config from './config';



const gameStates = [GameState.GameState ()];

let userCommandQueue: GameState.UserCommand[] = [];

const latestGameState = () => {
  return gameStates[gameStates.length - 1];
}



const updateClients = (gameStates: GameState.GameState[]) => {
  gameStates = [...gameStates];

  while (gameStates.length > 0) {
    const gameState = gameStates[0];
    gameStates.shift();
    
    SocketService.emit({ kind: 'fullUpdate',  gameState: gameState });
  }
}

let delta = 0;
let lastFrameTimeMs = performance.now();
let clearExpiredStates = false;

SocketService.subscribe(userCommandQueue);
setTimeout(function tick () {
	const start = performance.now();
  const userCommands = [...userCommandQueue];
  userCommandQueue.length = 0;

  const userCommandDeltas = GameState.processUserCommands(userCommands);
  let world: World.World = { ...latestGameState().world };

  userCommandDeltas.forEach(d => {
    world = World.reduce(d, world);
  });

  delta += start - lastFrameTimeMs;
  lastFrameTimeMs = start;

  const allDeltas: GameState.GameStateDelta[] = [...userCommandDeltas];
  const gameStatesBuffer: GameState.GameState[] = [];

  let count = 0;
  while (delta >= Config.TICKRATE_MS) {
    if (count++ > 1) {
      console.log(count);
    }
    const gameStateDeltas = World.runPhysicalSimulationStep(world, Config.TICKRATE_MS / 1000);

    gameStateDeltas.forEach(d => {
      world = World.reduce(d, world);
      allDeltas.push(d);
    });

    gameStates.push({
      tick: latestGameState().tick + 1,
      world: world,
      deltas: [...allDeltas],
    });

    if (clearExpiredStates) {
      gameStates.shift();
    } else if ((gameStates.length-1) * Config.TICKRATE_MS > Config.EXPIRE_AFTER_MS) {
      clearExpiredStates = true;
    }

    gameStatesBuffer.push(latestGameState());

    allDeltas.length = 0;

    delta -= Config.TICKRATE_MS;
  }

  updateClients(gameStatesBuffer);
	setTimeout(tick, Config.TICKRATE_MS - (performance.now() - start));
}, Config.TICKRATE_MS);
