import { getVoidObject, type PointerEventsMap } from "@pmndrs/pointer-events";
import { Billboard, Line, RoundedBox, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import { Handle, HandleTarget } from "@react-three/handle";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  type Object3DEventMap,
  type Vector3Tuple,
} from "three";
import { useModeStore, useSceneStore } from "~/stores";
import type { TransformKey } from "~/types";
import { SunGeometry } from "../customGeometries";
import CustomTransformHandles from "../interaction/CustomTransformHandles";
import Hover from "../interaction/Hover";
import StripedLineToCenter from "./StripeLineToCenter";

export default function SceneContent({
  isInScreen = false,
}: {
  isInScreen?: boolean;
}) {
  const isInXR = useXR((s) => s.session != null);
  const lightTarget = useMemo(
    () => new Object3D() as Object3D<Object3DEventMap & PointerEventsMap>,
    [],
  );
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
    return useSceneStore.subscribe((s) =>
      lightPositionChangeHandler(s.lightPosition),
    );
  }, []);

  const scene = useThree((s) => s.scene);
  const setIsAuthoringAnimation = useModeStore(
    (s) => s.setIsAuthoringAnimation,
  );
  useEffect(() => {
    const voidObject = getVoidObject(
      scene as unknown as Object3D<Object3DEventMap & PointerEventsMap>,
    ) as Object3D<Object3DEventMap & PointerEventsMap>;
    const deselectHandler = () => {
      useSceneStore.setState({ selected: undefined, selectedKeyframe: 0 });
      setIsAuthoringAnimation(false);
    };
    voidObject.addEventListener("click", deselectHandler);
    return () => voidObject.removeEventListener("click", deselectHandler);
  }, [scene, setIsAuthoringAnimation]);

  const sunHoverTargetRef = useRef<Mesh>(null);

  const pivotSize = isInScreen ? 2 : 1;
  const isAuthoringAnimation = useModeStore((s) => s.isAuthoringAnimation);
  const selected = useSceneStore((s) => s.selected);
  const selectedKeyframe = useSceneStore((s) => s.selectedKeyframe);

  const transformKey: TransformKey | undefined = selected
    ? (`${selected}Transformation` as TransformKey)
    : undefined;
  const EMPTY: [] = [];
  const keyframes = useSceneStore((s) =>
    transformKey ? s[transformKey] : EMPTY,
  );

  return (
    <>
      <ambientLight intensity={1.5} />
      {/* Warm up drei Text (troika) and Line (meshline) once at load to avoid first-time suspense blank */}
      <group visible={false}>
        <Text fontSize={0.001} position={[1000, 1000, 1000]}>
          .
        </Text>
        <Line points={[[0, 0, 0], [0, 0.001, 0]]} color="white" lineWidth={1} />
      </group>
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
                emissiveIntensity={hovered || (isInXR && selected === "cone") ? 0.3 : 0}
                emissive={(isInXR && selected === "cone") ? "skyblue" : "brown"}
                toneMapped={false}
                color={(isInXR && selected === "cone") ? "skyblue" : "brown"}
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
                emissiveIntensity={hovered || (isInXR && selected === "sphere") ? 0.3 : 0}
                emissive={(isInXR && selected === "sphere") ? "skyblue" : "salmon"}
                toneMapped={false}
                color={(isInXR && selected === "sphere") ? "skyblue" : "salmon"}
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
                emissiveIntensity={hovered || (isInXR && selected === "cube") ? 0.3 : 0}
                emissive={(isInXR && selected === "cube") ? "skyblue" : "orangered"}
                toneMapped={false}
                color={(isInXR && selected === "cube") ? "skyblue" : "orangered"}
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>

      <Platform lightTarget={lightTarget} />
      <group visible={isAuthoringAnimation && selected != null}>
        {keyframes.map((keyframe, i) => {
          if (i === selectedKeyframe) return null;
          return (
            <Hover key={`kf-${selected ?? 'none'}-${i}`}>
              {(hovered) => (
                <mesh
                  position={keyframe.position}
                  rotation={keyframe.rotation}
                  scale={keyframe.scale.map((s) => s * 0.02) as Vector3Tuple}
                  onClick={(e) => {
                    e.stopPropagation();
                    useSceneStore.setState({ selectedKeyframe: i });
                  }}
                >
                  {selected === "sphere" && <sphereGeometry />}
                  {selected === "cube" && <boxGeometry />}
                  {selected === "cone" && <cylinderGeometry args={[0, 1]} />}
                  {selected == null && <sphereGeometry />}
                  <meshStandardMaterial
                    emissiveIntensity={hovered ? 0.3 : 0}
                    emissive={0xffffff}
                    toneMapped={false}
                    color={hovered ? "white" : "gray"}
                  />
                </mesh>
              )}
            </Hover>
          );
        })}
      </group>
      <group visible={isAuthoringAnimation && selected != null && keyframes.length > 1}>
        {keyframes.slice(0, -1).map((kf, i) => (
          <Line
            key={`kf-line-${selected ?? 'none'}-${i}`}
            points={[kf.position, keyframes[i + 1].position]}
            color="gray"
            lineWidth={1}
            dashed={false}
          />
        ))}
        {keyframes.map((kf, i) => {
          if (i === selectedKeyframe) return null;
          return (
            <Billboard
              key={`kf-label-${selected ?? 'none'}-${i}`}
              position={[
                kf.position[0],
                kf.position[1] + 0.035,
                kf.position[2],
              ]}
              follow
            >
              <Text
                fontSize={0.025}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.002}
                outlineColor="black"
              >
                {String(i)}
              </Text>
            </Billboard>
          );
        })}
      </group>
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
