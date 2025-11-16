import { v4 as uuidv4 } from "uuid";
import { useEditorStore, useSceneStore } from "~/stores";

export const clientId = uuidv4();

export function pickDBFields() {
  const scene = useSceneStore.getState();
  const editor = useEditorStore.getState();
  return {
    lightPosition: scene.lightPosition,
    content: scene.content,

    mode: editor.mode,
    selectedObjId: editor.selectedObjId,
    objStateIdxMap: editor.objStateIdxMap,
  };
}

export function stringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
