import { type Vector3Tuple } from "three";

export type ElementType = "sphere" | "cube" | "cone";

export type Vec3InputType = "position" | "rotation" | "scale";

export type Transformation = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

export type ProjectsData = Partial<{
  light_position: Vector3Tuple;
  sphere_transformation: Transformation;
  cube_transformation: Transformation;
  cone_transformation: Transformation;
  edited_by_client: string;
  edited_at: string;
}>;
