export type Vector3 = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const add = (a: Vector3) => (b: Vector3) => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

export const subtract = (a: Vector3) => (b: Vector3) => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }
}

export const scale = (scaleFactor: number) => (v: Vector3): Vector3 => {
  return {
    x: scaleFactor * v.x,
    y: scaleFactor * v.y,
    z: scaleFactor * v.z,
  }
}

export const eq = (a: Vector3) => (b: Vector3) => {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export const ZERO = {x: 0, y: 0, z: 0};