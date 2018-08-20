import * as io from 'socket.io';
import { performance } from 'perf_hooks';

import * as World from './domain/world';
import * as GameState from './domain/gameState';
import { ServerEmission } from './domain/serverEmission';
import { Controller, ControllerAction } from './domain/controller';
import * as Player from './domain/player';

const client = io.listen(4000).sockets;

let gameState = GameState.GameState ();

let userCommandQueue: UserCommand[] = [];

export type UserCommand = World.AddPlayer | World.FilterOutPlayerById | Player.PlayerControllerAction;

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

const updateClients = (userCommands: GameState.GameStateDelta[]) => {
  userCommands = [...userCommands];

  while (userCommands.length > 0) {
    const action = userCommands[0];
    userCommands.shift();
    userCommandQueue.shift();

    switch (action.kind) {
      case 'world.addPlayer':
          emit([action.player.id], { kind: 'fullUpdate', tick: gameState.tick, world: gameState.world });
        break;
      case 'world.players.filterOut':
        break;
      case 'player.displacement':
        break;
      case 'player.controllerAction':
        break;
      default:
        const _exhaustiveCheck: never = action;
        return _exhaustiveCheck;
    }
    
    emit('all', { kind: 'gameStateDeltaEmission', tick: gameState.tick, gsd: action });
  }
}

subscribe(userCommandQueue);
setTimeout(function tick () {
	const start = performance.now();
  const userCommands = [...userCommandQueue];

  const userCommandDeltas = GameState.processUserCommands(userCommands);
  let world: World.World = { ...gameState.world };

  userCommandDeltas.forEach(d => {
    world = World.reduce(d, world);
  });

  const gameStateDeltas = World.runPhysicalSimulationStep(world, GameState.TICKRATE / 1000);

  gameStateDeltas.forEach(d => {
    world = World.reduce(d, world);
  });

  const allDeltas = [...userCommandDeltas, ...gameStateDeltas];

  gameState.tick++;
  gameState.world = world;
  
  if (allDeltas.length > 0) {
    gameState.worldActions[gameState.tick] = allDeltas;
  }

  updateClients(allDeltas);
	setTimeout(tick, GameState.TICKRATE - (performance.now() - start));
}, GameState.TICKRATE);
