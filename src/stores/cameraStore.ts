import { createScreenCameraStore } from "@react-three/handle";

export const cameraStore = createScreenCameraStore({
  distance: 1,
  pitch: -Math.PI / 8,
  yaw: Math.PI / 2,
});
