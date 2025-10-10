import { Canvas as R3FCanvas } from "@react-three/fiber";
import { OrbitHandles } from "@react-three/handle";
import {
  IfInSessionMode,
  noEvents,
  PointerEvents,
  XR,
  XROrigin,
} from "@react-three/xr";
import { BackSide } from "three";
import { xrStore } from "~/stores";
import Scene from "./scene/Scene";

export default function Canvas() {
  return (
    <R3FCanvas
      shadows="soft"
      camera={{ position: [-0.5, 0.5, 0.5] }}
      events={noEvents}
      style={{ width: "100%", flexGrow: 1 }}
    >
      <XR store={xrStore}>
        <CanvasBg />
        <group>
          <PointerEvents />
          <OrbitHandles damping />
          <XROrigin position={[0, -1, 0.5]} />
          <Scene />
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
