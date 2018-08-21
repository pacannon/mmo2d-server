import * as io from 'socket.io';
import { performance } from 'perf_hooks';

import * as World from './domain/world';
import * as GameState from './domain/gameState';
import { ServerEmission } from './domain/serverEmission';
import { Controller, ControllerAction } from './domain/controller';
import * as Player from './domain/player';

const client = io.listen(4000).sockets;

let gameStates = [GameState.GameState ()];

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
      position: { x:randomMagnitude * Math.cos(randomTheta), y: randomMagnitude * Math.sin(randomTheta), z: 20 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    };

    const addPlayer: World.AddPlayer = {
      kind: 'world.addPlayer',
      player: player,
    }

    userCommandQueue.push(addPlayer);

    socket.on('clientEmission', (data: ControllerAction) => {
      userCommandQueue.push({kind: 'player.controllerAction', playerId: socket.id, action: data});
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

const emit = (toWhom: string[] | 'all', serverEmission: ServerEmission) => {
  //console.log('===EMITTING TO ' + JSON.stringify(toWhom) + '===');
  //console.log(JSON.stringify(serverEmission));
  if (toWhom === 'all') {
    client.emit('serverEmission', serverEmission);
  } else {
    toWhom.forEach(playerId => client.sockets[playerId].emit('serverEmission', serverEmission));
  }
  //console.log('===DONE EMITTING===');
  //console.log();
};

const updateClients = (gameStates: GameState.GameState[]) => {
  gameStates = [...gameStates];

  while (gameStates.length > 0) {
    const gameState = gameStates[0];
    gameStates.shift();
    
    emit('all', { kind: 'fullUpdate',  gameState: gameState });
  }
}

let delta = 0;
let lastFrameTimeMs = performance.now();

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

  while (delta >= GameState.TICKRATE) {
    const gameStateDeltas = World.runPhysicalSimulationStep(world, GameState.TICKRATE / 1000);

    gameStateDeltas.forEach(d => {
      world = World.reduce(d, world);
      allDeltas.push(d);
    });

    gameStates.push({
      tick: latestGameState().tick + 1,
      world: world,
      deltas: [...allDeltas],
    });

    gameStatesBuffer.push(latestGameState());

    allDeltas.length = 0;

    delta -= GameState.TICKRATE;
  }

  updateClients(gameStatesBuffer);
	setTimeout(tick, GameState.TICKRATE - (performance.now() - start));
}, GameState.TICKRATE);
