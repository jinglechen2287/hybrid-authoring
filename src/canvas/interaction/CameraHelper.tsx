import { applyDampedScreenCameraState } from "@pmndrs/handle";
import { useFrame } from "@react-three/fiber";
import { Handle, HandleTarget } from "@react-three/handle";
import { IfInSessionMode } from "@react-three/xr";
import { useMemo, useRef, type RefObject } from "react";
import { Mesh, Object3D, type Object3DEventMap } from "three";
import { EMISSIVE, SCALES } from "~/constants";
import { cameraStore } from "~/stores";
import { CameraGeometry } from "../customGeometries";
import { Hover } from "./Hover";

export function CameraHelper() {
  const ref = useRef<Object3D>(null);
  const update = useMemo(
    () =>
      applyDampedScreenCameraState(
        cameraStore,
        () => ref.current,
        () => true,
      ),
    [],
  );
  useFrame((_state, dt) => update(dt * 1000));
  const hoverTargetRef = useRef<Mesh>(null);

  return (
    <IfInSessionMode allow={["immersive-ar", "immersive-vr"]}>
      <HandleTarget ref={ref}>
        <Hover
          hoverTargetRef={
            hoverTargetRef as unknown as RefObject<Object3D<Object3DEventMap> | null>
          }
        >
          {(hovered) => (
            <>
              <Handle
                targetRef="from-context"
                apply={(state) => {
                  const cameraState = cameraStore.getState();
                  cameraState.setCameraPosition(
                    ...state.current.position.toArray(),
                  );
                }}
                scale={false}
                multitouch={false}
                rotate={false}
              >
                <mesh ref={hoverTargetRef} scale={hovered ? SCALES.HANDLE_MEDIUM.hover : SCALES.HANDLE_MEDIUM.default}>
                  <sphereGeometry />
                  <meshStandardMaterial
                    emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                    emissive={0xffffff}
                    toneMapped={false}
                    color="grey"
                  />
                </mesh>
              </Handle>
              <group scale-x={16 / 9} rotation-y={Math.PI}>
                <mesh position-z={0.1} scale={hovered ? SCALES.HANDLE_SMALL.hover : SCALES.HANDLE_SMALL.default}>
                  <CameraGeometry />
                  <meshStandardMaterial
                    emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                    emissive={0xffffff}
                    toneMapped={false}
                    color="grey"
                  />
                </mesh>
              </group>
            </>
          )}
        </Hover>
      </HandleTarget>
    </IfInSessionMode>
  );
}
