import { useSceneStore } from "~/stores";

export function pickDbFields() {
  const state = useSceneStore.getState();
  return {
    lightPosition: state.lightPosition,
    sphereTransformation: state.sphereTransformation,
    cubeTransformation: state.cubeTransformation,
    coneTransformation: state.coneTransformation,
  };
}

export function stringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}
