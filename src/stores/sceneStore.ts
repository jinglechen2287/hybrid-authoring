import { type Vector3Tuple } from "three";
import { create } from "zustand";
import type { SceneData } from "~/types";

export const useSceneStore = create<SceneData>(() => ({
  lightPosition: [0.3, 0.3, 0.3] as Vector3Tuple,
  content: {},
}));
