import * as io from 'socket.io';

import * as World from './domain/world';
import { setInterval } from 'timers';
import { GameState, update } from './domain/gameState';
import { ServerEmission } from './domain/serverEmission';
import { Controller } from './domain/controller';

const client = io.listen(4000).sockets;

let gameState = GameState ();

let actionQueue: World.WorldAction[] = [];


export const subscribe = (actionQueue: World.WorldAction[]) => {
  // Connect to Socket.io
  client.on('connection', (socket) => {
    console.log('connected w/ ' + socket.id);

    const randomTheta = 2 * Math.PI * Math.random();
    const randomMagnitude = 4 * Math.sqrt(Math.random());

    const player = {
      id: socket.id,
      controller: Controller (),
      position: { x:randomMagnitude * Math.cos(randomTheta), y: randomMagnitude * Math.sin(randomTheta), z: 5 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    };

    const addPlayer: World.AddPlayer = {
      kind: 'world.addPlayer',
      player: player,
    }

    actionQueue.push(addPlayer);

    socket.on('disconnect', (_reason) => {
      console.log('disconneded w/ ', socket.id);

      const filterOutPlayerById: World.FilterOutPlayerById = {
        kind: 'world.players.filterOut',
        id: socket.id,
      }

      actionQueue.push(filterOutPlayerById);
    });
  });
};

const emit = (toWhom: string[] | 'all', serverEmission: ServerEmission) => {
  console.log('===EMITTING TO ' + JSON.stringify(toWhom) + '===');
  console.log(JSON.stringify(serverEmission));
  if (toWhom === 'all') {
    client.emit('serverEmission', serverEmission);
  } else {
    toWhom.forEach(playerId => client.sockets[playerId].emit('serverEmission', serverEmission));
  }
  console.log('===DONE EMITTING===');
  console.log();
};

const updateClients = (userCommands: World.WorldAction[]) => {
  userCommands = [...userCommands];

  while (userCommands.length > 0) {
    const action = userCommands[0];
    userCommands.shift();
    actionQueue.shift();

    switch (action.kind) {
      case 'world.addPlayer':
          emit([action.player.id], { kind: 'fullUpdate', tick: gameState.tick, world: gameState.world });
        break;
      case 'world.players.filterOut':
        break;
      default:
        const _exhaustiveCheck: never = action;
        return _exhaustiveCheck;
    }
    
    emit('all', { kind: 'gameStateDelta', tick: gameState.tick, worldAction: action });
  }
}

const TICKRATE = 15;
subscribe(actionQueue);
setInterval(() => {
  const userCommands = [...actionQueue];

  gameState = update(gameState, userCommands);
  updateClients(userCommands);
}, TICKRATE);
