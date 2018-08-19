import * as THREE from 'three';

import { Player } from './player';

export type World = {
  players: Player[];
};

export const World = (): World => {
  return {
    players: [],
  };
};

export type WorldAction =
  | AddPlayer
  | FilterOutPlayerById

export interface AddPlayer {
  kind: 'world.addPlayer',
  player: Player,
}

export interface FilterOutPlayerById {
  kind: 'world.players.filterOut',
  id: string,
}

export const reduce = (action: WorldAction) => (world: World): World => {
  switch (action.kind) {
    case 'world.addPlayer':
      return addPlayer (action.player) (world);
    case 'world.players.filterOut':
      return filterOutPlayerId (action.id) (world);
  }
}

const addPlayer = (player: Player) => (world: World) => {
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



export const runPhysicalSimulationStep = (world: World, delta: number) => {
  const speed = 0.1;
  const playerMesh: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());

  world.players.forEach(player => {
    playerMesh.position.x = player.position.x;
    playerMesh.position.y = player.position.y;
    playerMesh.position.z = player.position.z;
    playerMesh.rotation.x = player.rotation.x;
    playerMesh.rotation.y = player.rotation.y;
    playerMesh.rotation.z = player.rotation.z;
  
    if (player.controller.yawLeft) {
      playerMesh.rotateZ(speed * 0.3);
    }
  
    if (player.controller.yawRight) {
      playerMesh.rotateZ(-speed * 0.3);
    }
  
    if (player.controller.moveForward) {
      playerMesh.translateY(speed);
    }
  
    if (player.controller.moveBackward) {
      playerMesh.translateY(-speed);
    }
  
    if (player.controller.strafeLeft) {
      playerMesh.translateX(-speed);
    }
  
    if (player.controller.strafeRight) {
      playerMesh.translateX(speed);
    }
  
    const acceleratePlayer = (player: Player) => {
      const netAcceleration = new THREE.Vector3(0, 0, -9.8);

      const playerVelocity = new THREE.Vector3(player.velocity.x, player.velocity.y, player.velocity.z);
  
      const newVelocity = playerVelocity.addScaledVector(netAcceleration, delta);
  
      if (playerMesh.position.z > 0 || player.velocity.z > 0) {
        player.velocity = newVelocity;
        playerMesh.position.addScaledVector(newVelocity, delta);
      } else {
        player.velocity = new THREE.Vector3();
        playerMesh.position.z = 0;
      }

      player.position.x = playerMesh.position.x;
      player.position.y = playerMesh.position.y;
      player.position.z = playerMesh.position.z;
    };
  
    acceleratePlayer(player);
  });
}