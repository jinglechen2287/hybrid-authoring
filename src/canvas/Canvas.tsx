import { Canvas as R3FCanvas } from "@react-three/fiber";
import { OrbitHandles, HandleTarget } from "@react-three/handle";
import { noEvents, PointerEvents, XR, XROrigin } from "@react-three/xr";
import { xrStore } from "~/stores";
import SceneBg from "./SceneBg";
import Scene from "./Scene";
import { SceneTransformHandles, SceneRotateAndScaleHandles } from "./SceneHandles";
// import CameraHelper from "./CameraHelper";
// import Screen from "./Screen";

export default function Canvas() {
  return (
    <R3FCanvas
      shadows="soft"
      camera={{ position: [-0.5, 0.5, 0.5] }}
      events={noEvents}
      style={{ width: "100%", flexGrow: 1 }}
    >
      <XR store={xrStore}>
        <SceneBg />
        <group>
          <PointerEvents />
          <OrbitHandles damping />
          <XROrigin position={[0, -1, 0.5]} />
          <HandleTarget>
            <Scene />
            <SceneTransformHandles />
            <SceneRotateAndScaleHandles />
            {/* <CameraHelper /> */}
          </HandleTarget>
          {/* <Screen /> */}
        </group>
      </XR>
    </R3FCanvas>
  );
}

