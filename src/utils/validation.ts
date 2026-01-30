import type { CameraData, CoreEditorData, SceneData } from "~/types";

/**
 * Type guard to validate if a value is valid CameraData.
 * Checks for required fields: distance, yaw, pitch, and origin (3-element number array).
 */
export function isValidCameraData(value: unknown): value is CameraData {
  if (!value || typeof value !== "object") return false;
  const cam = value as Partial<CameraData>;
  return (
    typeof cam.distance === "number" &&
    typeof cam.yaw === "number" &&
    typeof cam.pitch === "number" &&
    Array.isArray(cam.origin) &&
    cam.origin.length === 3 &&
    cam.origin.every((n) => typeof n === "number")
  );
}

/**
 * Type guard to validate if a value is valid CoreEditorData.
 * Checks for required fields: mode (must be "edit" or "play"), and objStateIdxMap (object).
 */
export function isValidEditorData(value: unknown): value is CoreEditorData {
  if (!value || typeof value !== "object") return false;
  const editor = value as Partial<CoreEditorData>;
  return (
    (editor.mode === "edit" || editor.mode === "play") &&
    typeof editor.objStateIdxMap === "object" &&
    editor.objStateIdxMap !== null &&
    typeof editor.isHybrid === "boolean"
  );
}

/**
 * Type guard to validate if a value is valid SceneData.
 * Checks for required fields: lightPosition (3-element number array) and content (object, not array).
 */
export function isValidSceneData(value: unknown): value is SceneData {
  if (!value || typeof value !== "object") return false;
  const scene = value as Partial<SceneData>;
  return (
    Array.isArray(scene.lightPosition) &&
    scene.lightPosition.length === 3 &&
    scene.lightPosition.every((n) => typeof n === "number") &&
    typeof scene.content === "object" &&
    scene.content !== null &&
    !Array.isArray(scene.content)
  );
}
