import * as Vector3 from './vector3';
import { Controller } from './controller';

export type Player = {
  readonly id: string;
  readonly position: Vector3.Vector3;
  readonly rotation: Vector3.Vector3;
  readonly velocity: Vector3.Vector3;
  readonly controller: Controller;
}

export interface PlayerDisplacement {
  readonly kind: 'playerDisplacement';
  playerId: string;
  dP: Vector3.Vector3;
  dV: Vector3.Vector3;
  dR: Vector3.Vector3;
}

export const PlayerDisplacement = (playerId: string) => (dP: Vector3.Vector3, dV: Vector3.Vector3, dR: Vector3.Vector3) => {
  return {
    playerId: playerId,
    dP,
    dV,
    dR,
  }
};

export const Displace = (player: Player, playerDisplacement: PlayerDisplacement): Player => {
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