import * as THREE from 'three';

import * as Player from './player';
import * as GameState from './gameState';
import * as Vector3 from './vector3';
import * as Block from './block';

export type World = {
  blocks: Block.Block[];
  players: Player.Player[];
};

export const World = (): World => {
  return {
    blocks: [{ position: { x: -2, y: 2, z: 3 } }, { position: { x: -1, y: 2, z: 3 } }],
    players: [],
  };
};

export type WorldAction =
  | AddPlayer
  | FilterOutPlayerById
  | Player.PlayerDisplacement
  | Player.PlayerControllerAction

export interface AddPlayer {
  readonly kind: 'world.addPlayer',
  player: Player.Player,
}

export interface FilterOutPlayerById {
  readonly kind: 'world.players.filterOut',
  id: string,
}

export const reduce = (action: WorldAction, world: World): World => {
  switch (action.kind) {
    case 'world.addPlayer':
      return addPlayer (action.player) (world);
    case 'world.players.filterOut':
      return filterOutPlayerId (action.id) (world);
    case 'player.displacement':
      return displacePlayer (action) (world);
    case 'player.controllerAction':
      return controlPlayer (action) (world);
  }
}

const addPlayer = (player: Player.Player) => (world: World) => {
  return {
    ...world,
    players: [...world.players, player],
  };
};

const filterOutPlayerId = (id: string) => (world: World) => {
  return {
    ...world,
    players: [...world.players.filter(p => p.id !== id)],
  };
};

const displacePlayer = (displacement: Player.PlayerDisplacement) => (world: World): World => {
  return {
    ...world,
    players: [...world.players.map(p => {
      if (p.id === displacement.playerId) {

        return {
          ...Player.reduce(p, displacement),
        }
      }
      return p;
    })],
  };
};

const controlPlayer = (control: Player.PlayerControllerAction) => (world: World): World => {
  return {
    ...world,
    players: [...world.players.map(p => {
      if (p.id === control.playerId) {

        return {
          ...Player.reduce(p, control),
        }
      }
      return p;
    })],
  };
};

export const runPhysicalSimulationStep = (world: World, delta: number): GameState.GameStateDelta[] => {
  const gameStateDeltas: GameState.GameStateDelta[] = [];
  const speed = 5;
  const playerMesh: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
  world.players.forEach(player => {
    playerMesh.position.x = player.position.x;
    playerMesh.position.y = player.position.y;
    playerMesh.position.z = player.position.z;
    playerMesh.rotation.x = player.rotation.x;
    playerMesh.rotation.y = player.rotation.y;
    playerMesh.rotation.z = player.rotation.z;
  
    const acceleratePlayer = (player: Player.Player) => {
      const netAcceleration = new THREE.Vector3(0, 0, -9.8);

      const playerVelocity = new THREE.Vector3(player.velocity.x, player.velocity.y, player.velocity.z);
      const playerPosition = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
  
      let newVelocity = playerVelocity.addScaledVector(netAcceleration, delta);
      const newPosition = playerPosition.addScaledVector(newVelocity, delta);

      playerMesh.position.copy(newPosition);
  
      if (playerMesh.position.z < 0) {
        newVelocity.z = 0;
        playerMesh.position.z = 0;
      }
      
      if (player.controller.yawLeft) {
        playerMesh.rotateZ(speed * 0.3 * delta);
      }
    
      if (player.controller.yawRight) {
        playerMesh.rotateZ(-speed * 0.3 * delta);
      }
    
      if (player.controller.moveForward) {
        playerMesh.translateY(speed * delta);
      }
    
      if (player.controller.moveBackward) {
        playerMesh.translateY(-speed * delta);
      }
    
      if (player.controller.strafeLeft) {
        playerMesh.translateX(-speed * delta);
      }
    
      if (player.controller.strafeRight) {
        playerMesh.translateX(speed * delta);
      }

      const displacement: Player.PlayerDisplacement = {
        kind: 'player.displacement',
        playerId: player.id,
        dP: Vector3.subtract(playerMesh.position)(player.position),
        dR: Vector3.subtract(playerMesh.rotation)(player.rotation),
        dV: Vector3.subtract(newVelocity)(player.velocity),
      }

      if (Player.shouldEmit(displacement)) {
        gameStateDeltas.push(displacement);
      }
    };
  
    acceleratePlayer(player);
  });

  return gameStateDeltas;
}