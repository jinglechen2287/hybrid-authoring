import { type Vector3Tuple, type QuaternionTuple } from "three";

export type ElementType = "sphere" | "cube" | "cone";

export type Vec3InputType = "position" | "rotation" | "scale";

export type Transformation = {
  position: Vector3Tuple;
  rotation: QuaternionTuple;
  scale: Vector3Tuple;
};
