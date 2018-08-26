import * as io from 'socket.io';

import * as Controller from './controller';
import * as GameState from './gameState';
import * as World from './world';
import * as ServerEmission from './serverEmission';
import * as Config from '../config';

let client: io.Namespace = io.listen(Config.PORT).sockets;

export const listen = () => {
  client = io.listen(Config.PORT).sockets;
};

export const subscribe = (userCommandQueue: GameState.UserCommand[]) => {
  client.on('connection', (socket) => {
    console.log('connected w/ ' + socket.id);

    const randomTheta = 2 * Math.PI * Math.random();
    const randomMagnitude = 4 * Math.sqrt(Math.random());

    const player = {
      id: socket.id,
      controller: Controller.Controller (),
      position: { x:randomMagnitude * Math.cos(randomTheta), y: randomMagnitude * Math.sin(randomTheta), z: 40 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 }
    };

    const addPlayer: World.AddPlayer = {
      kind: 'world.addPlayer',
      player: player,
    }

    userCommandQueue.push(addPlayer);

    socket.on('clientEmission', (data: GameState.UserCommand) => {
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


export const emit = (serverEmission: ServerEmission.ServerEmission) => {
  const LOG_EMIT = false;

  const emitNow = () => {
    if (LOG_EMIT) {
      console.log('===EMITTING===');
      console.log(JSON.stringify(serverEmission));
    }
    client.emit('serverEmission', serverEmission);
    if (LOG_EMIT) {
      console.log('===DONE EMITTING===');
      console.log();
    }
  }

  if (Config.SIMULATE_LAG_MS === undefined) {
    emitNow();
  } else {
    setTimeout(() => {
      emitNow();
    }, Config.SIMULATE_LAG_MS / 2);
  }
};