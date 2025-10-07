import { type Vector3Tuple } from "three";

export type ElementType = "sphere" | "cube" | "cone";

export type Vec3InputType = "position" | "rotation" | "scale";

export type Transformation = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};
