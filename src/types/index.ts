import { type Vector3Tuple } from "three";

export type ElementType = "sphere" | "cube" | "cone";

export type Vec3InputType = "position" | "rotation" | "scale";

export type Transformation = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

export type SceneObject = {
    type: ElementType;
    states: Transformation[];
}

export type SceneData = {
  lightPosition: Vector3Tuple;
  content: {
    [id: string]: SceneObject;
  }
}

export type ProjectsData = Partial<{
  scene: SceneData;
  edited_by_client: string;
  edited_at: string;
}>;
