import { type Vector3Tuple, Quaternion } from "three";

const quaternion = new Quaternion().toArray();
console.log(quaternion);

export function createDefaultTransformation(x: number, y: number, z: number) {
  return {
    position: [x, y, z] as Vector3Tuple,
    rotation: new Quaternion().toArray(),
    scale: [1, 1, 1] as Vector3Tuple,
  };
}
