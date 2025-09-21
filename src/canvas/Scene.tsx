import { type RefObject, useEffect, useMemo, useRef } from "react";

import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  type Object3DEventMap,
  type Vector3Tuple,
} from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Handle, HandleTarget } from "@react-three/handle";
import { getVoidObject, type PointerEventsMap } from "@pmndrs/pointer-events";

import { useSceneStore } from "~/stores";
import Hover from "./Hover";
import CustomTransformHandles from "./CustomTransformHandles";
import StripedLineToCenter from "./StripeLineToCenter";
import { SunGeometry } from "./customGeometries";

export default function Scene({ isInScreen = false }: { isInScreen?: boolean }) {
  const lightTarget = useMemo(() => new Object3D(), []);
  const light = useMemo(() => new DirectionalLight(), []);
  light.castShadow = true;
  light.shadow.camera.left = -0.5;
  light.shadow.camera.right = 0.5;
  light.shadow.camera.bottom = -0.5;
  light.shadow.camera.top = 0.5;
  light.shadow.camera.near = 0;
  light.target = lightTarget;
  light.position.set(0, 0, 0);
  light.intensity = 4;

  const lightGroupRef = useRef<Group>(null);
  useEffect(() => {
    const lightPositionChangeHandler = (state: Vector3Tuple) => {
      lightGroupRef.current?.position.set(...state);
    };
    lightPositionChangeHandler(useSceneStore.getState().lightPosition);
    return useSceneStore.subscribe((s) => lightPositionChangeHandler(s.lightPosition));
  }, []);

  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const voidObject = getVoidObject(scene) as Object3D<
      Object3DEventMap & PointerEventsMap
    >;
    const deselectHandler = () => {
      useSceneStore.setState({ selected: undefined });
    };
    voidObject.addEventListener("click", deselectHandler);
    return () => voidObject.removeEventListener("click", deselectHandler);
  }, [scene]);

  const sunHoverTargetRef = useRef<Mesh>(null);

  const pivotSize = isInScreen ? 2 : 1;

  return (
    <>
      <ambientLight intensity={1.5} />
      <Hover hoverTargetRef={sunHoverTargetRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <>
            {isInScreen || (
              <StripedLineToCenter
                color={hovered ? "white" : "gray"}
                width={hovered ? 0.008 : 0.005}
                fromRef={lightGroupRef as RefObject<Object3D | null>}
              />
            )}
            <HandleTarget ref={lightGroupRef as RefObject<Object3D | null>}>
              <primitive object={light} />
              {isInScreen || (
                <>
                  <Handle
                    targetRef="from-context"
                    apply={(state) =>
                      useSceneStore.setState({
                        lightPosition: state.current.position.toArray(),
                      })
                    }
                    scale={false}
                    multitouch={false}
                    rotate={false}
                  >
                    <mesh
                      ref={sunHoverTargetRef}
                      scale={hovered ? 0.025 : 0.02}
                    >
                      <sphereGeometry />
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </mesh>
                  </Handle>
                  <mesh scale={(hovered ? 0.025 : 0.02) * 0.7}>
                    <SunGeometry />
                    <meshStandardMaterial
                      emissiveIntensity={hovered ? 0.3 : 0}
                      emissive={0xffffff}
                      toneMapped={false}
                      color="grey"
                    />
                  </mesh>
                </>
              )}
            </HandleTarget>
          </>
        )}
      </Hover>
      <CustomTransformHandles size={pivotSize} target="cone">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <cylinderGeometry args={[0, 1]} />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="blue"
                toneMapped={false}
                color="blue"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>

      <CustomTransformHandles size={pivotSize} target="sphere">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <sphereGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="green"
                toneMapped={false}
                color="green"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>
      <CustomTransformHandles size={pivotSize} target="cube">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="red"
                toneMapped={false}
                color="red"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>

      <Platform lightTarget={lightTarget} />
    </>
  );
}

function Platform({ lightTarget }: { lightTarget: Object3D }) {
  return (
    <RoundedBox
      receiveShadow
      rotation-x={Math.PI / 2}
      position-y={-0.05}
      scale={0.1}
      args={[6, 6, 0.1]}
    >
      <meshStandardMaterial toneMapped={false} color="purple" />
      <primitive object={lightTarget} />
    </RoundedBox>
  );
}
