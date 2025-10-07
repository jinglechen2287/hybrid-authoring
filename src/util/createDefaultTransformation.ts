import { type Vector3Tuple } from "three";

export function createDefaultTransformation(x: number, y: number, z: number) {
  return {
    position: [x, y, z] as Vector3Tuple,
    rotation: [0, 0, 0] as Vector3Tuple,
    scale: [1, 1, 1] as Vector3Tuple,
  };
}
