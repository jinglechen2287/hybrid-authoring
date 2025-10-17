import { type Vector3Tuple } from "three";
import { create } from "zustand";
import type { SceneStore } from "~/types";

function createDefaultTransformation(x: number, y: number, z: number) {
  return {
    position: [x, y, z] as Vector3Tuple,
    rotation: [0, 0, 0] as Vector3Tuple,
    scale: [1, 1, 1] as Vector3Tuple,
  };
}

export const useSceneStore = create<SceneStore>(() => ({
  lightPosition: [0.3, 0.3, 0.3] as Vector3Tuple,
  sphereTransformation: [createDefaultTransformation(-0.1, 0, 0)],
  cubeTransformation: [createDefaultTransformation(0.1, 0, 0)],
  coneTransformation: [createDefaultTransformation(0, 0, 0.1)],
  selected: undefined,
  selectedKeyframe: 0,
}));
