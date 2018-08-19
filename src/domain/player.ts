import { Vector3 } from './vector3';
import { Controller } from './controller';

export type Player = {
  id: string;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  controller: Controller;
}