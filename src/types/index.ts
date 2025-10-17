import { type Vector3Tuple } from "three";

export type Mode = "edit" | "play";

export type ElementType = "sphere" | "cube" | "cone";

export type TransformKey =
  | "sphereTransformation"
  | "cubeTransformation"
  | "coneTransformation";

export type Vec3InputType = "position" | "rotation" | "scale";

export type Transformation = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

export type SceneStore = {
  lightPosition: Vector3Tuple;
  sphereTransformation: Transformation[];
  cubeTransformation: Transformation[];
  coneTransformation: Transformation[];
  selected: ElementType | undefined;
  selectedKeyframe: number;
};

export type ProjectsData = Partial<{
  light_position: Vector3Tuple;
  sphere_transformation: Transformation;
  cube_transformation: Transformation;
  cone_transformation: Transformation;
  edited_by_client: string;
  edited_at: string;
}>;
