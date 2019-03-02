import * as Vector3 from './vector3';
import * as Controller from './controller';

export type Player = {
  readonly id: string;
  readonly position: Vector3.Vector3;
  readonly rotation: Vector3.Vector3;
  readonly velocity: Vector3.Vector3;
  readonly controller: Controller.Controller;
}

export type PlayerAction = PlayerDisplacement | PlayerControllerAction;

export interface PlayerDisplacement {
  readonly kind: 'player.displacement';
  playerId: string;
  dP: Vector3.Vector3;
  dV: Vector3.Vector3;
  dR: Vector3.Vector3;
}

export interface PlayerControllerAction {
  readonly kind: 'player.controllerAction';
  readonly playerId: string;
  readonly action: Controller.ControllerAction;
}

export const reduce = (player: Player, action: PlayerAction): Player => {
  switch (action.kind) {
    case 'player.controllerAction':
      return control(player, action);
    case 'player.displacement':
      return displace (player, action);
  }
}

const control = (player: Player, action: PlayerControllerAction): Player => {
  if (action.playerId === player.id) {
    if (action.action.kind === 'jump' && player.position.y === 0) {
      return {
        ...player,
        velocity: {
          x: player.velocity.x,
          y: 3,
          z: player.velocity.z,
        }
      };
    } else if (action.action.kind === 'setRotation') {
      return {
        ...player,
        rotation: {
          x: 0,
          y: action.action.y,
          z: 0,
        },
      };
    }else {
      return {
        ...player,
        controller: Controller.reduce(player.controller, action.action),
      };
    }
  } else {
    return player;
  }
}

const displace = (player: Player, playerDisplacement: PlayerDisplacement): Player => {
  return {
    ...player,
    position: Vector3.add(player.position)(playerDisplacement.dP),
    velocity: Vector3.add(player.velocity)(playerDisplacement.dV),
    rotation: Vector3.add(player.rotation)(playerDisplacement.dR),
  }
}

export const shouldEmit = (displacement: PlayerDisplacement): boolean => {
  const eqZero = Vector3.eq(Vector3.ZERO);
  return !(eqZero(displacement.dP) && eqZero(displacement.dR) && eqZero(displacement.dV));
}