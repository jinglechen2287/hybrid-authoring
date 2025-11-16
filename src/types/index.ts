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
  name: string;
  states: ObjState[];
};

export type SceneData = {
  lightPosition: Vector3Tuple;
  content: {
    [id: string]: SceneObj;
  };
};

export type EditorMode = "edit" | "play";

export type CoreEditorData = {
  mode: EditorMode;
  selectedObjId: string | undefined;
  objStateIdxMap: Record<string, number>;
};

export type EditorStore = CoreEditorData & {
  toggleMode: () => void;
  setSelectedObjId: (value: string | undefined) => void;
  setObjStateIdxMap: (value: number) => void;

  // Connect-mode for creating transitions between states in canvas
  isConnecting: boolean;
  connectingFromObjId?: string;
  connectingFromStateId?: string;
  connectingTrigger: TriggerType;
  setConnectingFrom: (objId: string, stateId: string) => void;
  cycleConnectingTrigger: () => void;
  setConnectingTrigger: (trigger: TriggerType) => void;
  cancelConnecting: () => void;
};

export type CameraData = {
  distance: number;
  origin: Readonly<Vector3Tuple>;
  yaw: number;
  pitch: number;
};

export type ProjectsData = Partial<{
  scene: SceneData;
  editor: CoreEditorData;
  camera: CameraData;
  edited_by_client: string;
  edited_at: string;
}>;
