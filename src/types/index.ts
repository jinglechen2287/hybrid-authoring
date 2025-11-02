import { type Vector3Tuple } from "three";

export type ObjType = "sphere" | "cube" | "cone";

export type Vec3InputType = "position" | "rotation" | "scale";

export type TriggerType = "click" | "hoverStart" | "hoverEnd" | "auto" | "";

export type Transform = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
};

export type ObjState = {
  id: string;
  transform: Transform;
  trigger: TriggerType;
  transitionTo: string;
};

export type SceneObj = {
  type: ObjType;
  states: ObjState[];
};

export type SceneData = {
  lightPosition: Vector3Tuple;
  content: {
    [id: string]: SceneObj;
  };
};

export type ProjectsData = Partial<{
  scene: SceneData;
  edited_by_client: string;
  edited_at: string;
}>;
