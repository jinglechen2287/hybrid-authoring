import { useGLTF } from "@react-three/drei";
import { Mesh } from "three";

export function SunGeometry() {
  const sunGeometry = (useGLTF("sun.glb").scene.children[0] as Mesh).geometry;
  return <primitive attach="geometry" object={sunGeometry} />;
}

export function RotateGeometry() {
  const { scene } = useGLTF("rotate.glb");
  return (
    <primitive
      attach="geometry"
      object={(scene.children[2] as Mesh).geometry}
    />
  );
}

export function CameraGeometry() {
  const cameraGeometry = (useGLTF("camera.glb").scene.children[0] as Mesh)
    .geometry;
  return <primitive attach="geometry" object={cameraGeometry} />;
}
