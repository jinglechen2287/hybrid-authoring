import { useEditorStore, useSceneStore, cameraStore } from "~/stores";
import type { CoreEditorData, CameraData, SceneData } from "~/types";

export const clientId = crypto.randomUUID();

export function pickSceneFields(): SceneData {
  const scene = useSceneStore.getState();
  return {
    lightPosition: scene.lightPosition,
    content: scene.content,
  };
}

export function pickEditorFields(): CoreEditorData {
  const editor = useEditorStore.getState();
  return {
    mode: editor.mode,
    selectedObjId: editor.selectedObjId,
    objStateIdxMap: editor.objStateIdxMap,
    isHybrid: editor.isHybrid,
  };
}

export function pickCameraFields(): CameraData {
    const state = cameraStore.getState();
    return {
      distance: state.distance,
      yaw: state.yaw,
      pitch: state.pitch,
      origin: state.origin,
    };
  }

export function stringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
