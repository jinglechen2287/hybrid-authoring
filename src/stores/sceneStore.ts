import { create } from "zustand";
import { type Vector3Tuple } from "three";
import type { ElementType, Transformation } from "~/types";
import { createDefaultTransformation } from "~/util";

type SceneStore = {
  lightPosition: Vector3Tuple;
  sphereTransformation: Transformation;
  cubeTransformation: Transformation;
  coneTransformation: Transformation;
  selected: ElementType | undefined;
};

export const useSceneStore = create<SceneStore>(() => ({
  lightPosition: [0.3, 0.3, 0.3] as Vector3Tuple,
  sphereTransformation: createDefaultTransformation(-0.1, 0, 0),
  cubeTransformation: createDefaultTransformation(0.1, 0, 0),
  coneTransformation: createDefaultTransformation(0, 0, 0.1),
  selected: undefined as ElementType | undefined,
}));
