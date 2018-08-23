import * as io from 'socket.io';
import { performance } from 'perf_hooks';

import * as World from './domain/world';
import * as GameState from './domain/gameState';
import { ServerEmission } from './domain/serverEmission';
import { Controller, ControllerAction } from './domain/controller';
import * as Player from './domain/player';

const client = io.listen(4000).sockets;

const gameStates = [GameState.GameState ()];

let userCommandQueue: UserCommand[] = [];

export type UserCommand = World.AddPlayer | World.FilterOutPlayerById | Player.PlayerControllerAction;

const latestGameState = () => {
  return gameStates[gameStates.length - 1];
}

export const subscribe = (userCommandQueue: UserCommand[]) => {
  // Connect to Socket.io
  client.on('connection', (socket) => {
    console.log('connected w/ ' + socket.id);

    const randomTheta = 2 * Math.PI * Math.random();
    const randomMagnitude = 4 * Math.sqrt(Math.random());

    const player = {
      id: socket.id,
      controller: Controller (),
      position: { x:randomMagnitude * Math.cos(randomTheta), y: randomMagnitude * Math.sin(randomTheta), z: 30 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    };

    const addPlayer: World.AddPlayer = {
      kind: 'world.addPlayer',
      player: player,
    }

    userCommandQueue.push(addPlayer);

    socket.on('clientEmission', (data: UserCommand) => {
      userCommandQueue.push(data);
    });

    socket.on('disconnect', (_reason) => {
      console.log('disconneded w/ ', socket.id);

      const filterOutPlayerById: World.FilterOutPlayerById = {
        kind: 'world.players.filterOut',
        id: socket.id,
      }

      userCommandQueue.push(filterOutPlayerById);
    });
  });
};

const emit = (serverEmission: ServerEmission) => {
  const LOG_EMIT = false;
  //setTimeout(function() {
    if (LOG_EMIT) {
      console.log('===EMITTING===');
      console.log(JSON.stringify(serverEmission));
    }
    client.emit('serverEmission', serverEmission);
    if (LOG_EMIT) {
      console.log('===DONE EMITTING===');
      console.log();
    }
 // }, 0);
};

const updateClients = (gameStates: GameState.GameState[]) => {
  gameStates = [...gameStates];

  while (gameStates.length > 0) {
    const gameState = gameStates[0];
    gameStates.shift();
    
    emit({ kind: 'fullUpdate',  gameState: gameState });
  }
}

let delta = 0;
let lastFrameTimeMs = performance.now();
let clearExpiredStates = false;

subscribe(userCommandQueue);
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

  const allDeltas = [...userCommandDeltas];
  const gameStatesBuffer: GameState.GameState[] = [];

  let count = 0;
  while (delta >= GameState.TICKRATE_MS) {
    if (count++ > 1) {
      console.log(count);
    }
    const gameStateDeltas = World.runPhysicalSimulationStep(world, GameState.TICKRATE_MS / 1000);

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
    } else if ((gameStates.length-1) * GameState.TICKRATE_MS > GameState.EXPIRE_AFTER_MS) {
      clearExpiredStates = true;
    }

    gameStatesBuffer.push(latestGameState());

    allDeltas.length = 0;

    delta -= GameState.TICKRATE_MS;
  }

  updateClients(gameStatesBuffer);
	setTimeout(tick, GameState.TICKRATE_MS - (performance.now() - start));
}, GameState.TICKRATE_MS);
