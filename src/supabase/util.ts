import { useSceneStore } from "~/stores";

export function pickDbFields() {
  const state = useSceneStore.getState();
  return {
    lightPosition: state.lightPosition,
    content: state.content,
  };
}

export function stringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
