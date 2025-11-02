import { getVoidObject, type PointerEventsMap } from "@pmndrs/pointer-events";
import { Billboard, Line, RoundedBox, Text } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Handle, HandleTarget } from "@react-three/handle";
import { useXR } from "@react-three/xr";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  type Object3DEventMap,
  type Vector3Tuple,
} from "three";
import { useEditorStore, useSceneStore } from "~/stores";
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

  useEffect(() => {
    const voidObject = getVoidObject(
      scene as unknown as Object3D<Object3DEventMap & PointerEventsMap>,
    ) as Object3D<Object3DEventMap & PointerEventsMap>;
    const deselectHandler = () => {
      useEditorStore.setState({ selectedObjId: undefined });
    };
    voidObject.addEventListener("click", deselectHandler);
    return () => voidObject.removeEventListener("click", deselectHandler);
  }, [scene]);

  const sunHoverTargetRef = useRef<Mesh>(null);

  const pivotSize = isInScreen ? 2 : 1;
  const mode = useEditorStore((s) => s.mode);
  const isEditMode = mode === "edit";
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const setObjStateIdxMap = useEditorStore((s) => s.setObjStateIdxMap);
  const EMPTY: [] = [];
  const objStates = useSceneStore((s) =>
    selectedObjId ? (s.content[selectedObjId]?.states ?? EMPTY) : EMPTY,
  );
  const objects = useSceneStore((s) => s.content);
  const selectedObjType = useSceneStore((s) =>
    selectedObjId ? s.content[selectedObjId]?.type : undefined,
  );

  return (
    <>
      <ambientLight intensity={1.5} />
      {/* Warm up drei Text (troika) and Line (meshline) once at load to avoid first-time suspense blank */}
      <group visible={false}>
        <Text fontSize={0.001} position={[1000, 1000, 1000]}>
          .
        </Text>
        <Line
          points={[
            [0, 0, 0],
            [0, 0.001, 0],
          ]}
          color="white"
          lineWidth={1}
        />
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
      {Object.entries(objects).map(([id, obj]) => (
        <CustomTransformHandles key={id} size={pivotSize} objectId={id}>
          <Hover>
            {(hovered) => {
              const baseColor =
                obj.type === "sphere"
                  ? "salmon"
                  : obj.type === "cube"
                    ? "orangered"
                    : "brown";
              const isSel = isInXR && selectedObjId === id;
              const color = isSel ? "skyblue" : baseColor;
              return (
                <mesh castShadow receiveShadow scale={0.1}>
                  {obj.type === "sphere" && <sphereGeometry />}
                  {obj.type === "cube" && <boxGeometry />}
                  {obj.type === "cone" && <cylinderGeometry args={[0, 1]} />}
                  <meshStandardMaterial
                    emissiveIntensity={hovered || isSel ? 0.3 : 0}
                    emissive={isSel ? "skyblue" : 0xffffff}
                    toneMapped={false}
                    color={color}
                  />
                </mesh>
              );
            }}
          </Hover>
        </CustomTransformHandles>
      ))}

      <Platform lightTarget={lightTarget} />
      <group visible={isEditMode && selectedObjId != null}>
        {objStates.map((objState, i) => {
          const selectedObjStateIdx = selectedObjId
            ? (objStateIdxMap[selectedObjId] ?? 0)
            : 0;
          if (i === selectedObjStateIdx) return null;
          return (
            <Hover key={`obj-state-${selectedObjId ?? "none"}-${i}`}>
              {(hovered) => (
                <mesh
                  position={objState.position}
                  rotation={objState.rotation}
                  scale={objState.scale.map((s) => s * 0.02) as Vector3Tuple}
                  onClick={(e) => {
                    e.stopPropagation();
                    setObjStateIdxMap(i);
                  }}
                >
                  {selectedObjType === "sphere" && <sphereGeometry />}
                  {selectedObjType === "cube" && <boxGeometry />}
                  {selectedObjType === "cone" && (
                    <cylinderGeometry args={[0, 1]} />
                  )}
                  {selectedObjId == null && <sphereGeometry />}
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
      <group
        visible={
          isEditMode && selectedObjId != null && objStates.length > 1
        }
      >
        {objStates.slice(0, -1).map((objState, i) => (
          <Line
            key={`obj-state-line-${selectedObjId ?? "none"}-${i}`}
            points={[objState.position, objStates[i + 1].position]}
            color="gray"
            lineWidth={1}
            dashed={false}
          />
        ))}
        {objStates.map((objState, i) => {
          const selectedObjStateIdx = selectedObjId
            ? (objStateIdxMap[selectedObjId] ?? 0)
            : 0;
          if (i === selectedObjStateIdx) return null;
          return (
            <Billboard
              key={`obj-state-label-${selectedObjId ?? "none"}-${i}`}
              position={[
                objState.position[0],
                objState.position[1] + 0.035,
                objState.position[2],
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
