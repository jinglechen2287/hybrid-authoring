import type { CameraData } from "~/types";

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
