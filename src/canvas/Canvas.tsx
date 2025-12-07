import { Text } from "@react-three/drei";
import { Canvas as R3FCanvas } from "@react-three/fiber";
import { OrbitHandles } from "@react-three/handle";
import {
  IfInSessionMode,
  noEvents,
  PointerEvents,
  useXRPlanes,
  XR,
  XROrigin,
  XRPlaneModel,
  XRSpace,
} from "@react-three/xr";
import { BackSide } from "three";
import { cameraStore, xrStore } from "~/stores";
import Scene from "./scene/Scene";
// import { AnchoredScene } from "./AnchoredScene";

export default function Canvas() {
  return (
    <R3FCanvas
      shadows="soft"
      camera={{ position: [0, 1, -0.5] }}
      events={noEvents}
      style={{ width: "100%", flexGrow: 1 }}
    >
      <XR store={xrStore}>
        <CanvasBg />
        <group>
          <PointerEvents />
          <OrbitHandles damping store={cameraStore} />
          <XROrigin />
          <Scene />
          {/* <AnchoredScene /> */}
          <XRPlanes />
          {/* <Screen /> */}
        </group>
      </XR>
    </R3FCanvas>
  );
}

function CanvasBg() {
  return (
    // Hide in immersive AR
    <IfInSessionMode deny="immersive-ar">
      <mesh scale={1000}>
        <meshBasicMaterial side={BackSide} color="black" />
        <sphereGeometry />
      </mesh>
    </IfInSessionMode>
  );
}

function XRPlanes() {
  const xrPlanes = useXRPlanes();
  return (
    <>
      {xrPlanes.map((plane) => (
        <XRSpace space={plane.planeSpace}>
          <XRPlaneModel plane={plane}>
            <meshBasicMaterial
              color="blue"
              transparent
              opacity={0.4}
              side={2}
            />
          </XRPlaneModel>
          <Text
            position={[0, 0.1, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {plane.semanticLabel || "unknown"}
          </Text>
        </XRSpace>
      ))}
    </>
  );
}