import { getVoidObject, type PointerEventsMap } from "@pmndrs/pointer-events";
import {
  Billboard,
  Line,
  QuadraticBezierLine,
  RoundedBox,
  Text,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Handle, HandleTarget } from "@react-three/handle";
import { produce } from "immer";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  DirectionalLight,
  Group,
  Mesh,
  Object3D,
  Vector3,
  type Object3DEventMap,
  type Vector3Tuple,
} from "three";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData, TriggerType } from "~/types";
import { SunGeometry } from "../customGeometries";
import { CustomTransformHandles, Hover } from "../interaction";
import StripedLineToCenter from "./StripeLineToCenter";

export default function SceneContent({
  isInRoom = false,
}: {
  isInRoom?: boolean;
}) {
  const getTransitionColor = (trigger: TriggerType) => {
    switch (trigger) {
      case "click":
        return "orangered";
      case "hoverStart":
        return "skyblue";
      case "hoverEnd":
        return "green";
      case "auto":
        return "white";
      default:
        return "gray";
    }
  };
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
      useEditorStore.getState().cancelConnecting();
    };
    voidObject.addEventListener("click", deselectHandler);
    return () => voidObject.removeEventListener("click", deselectHandler);
  }, [scene]);

  const sunHoverTargetRef = useRef<Mesh>(null);

  const mode = useEditorStore((s) => s.mode);
  const isEditMode = mode === "edit";
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const setObjStateIdxMap = useEditorStore((s) => s.setObjStateIdxMap);
  const isConnecting = useEditorStore((s) => s.isConnecting);
  const connectingFromObjId = useEditorStore((s) => s.connectingFromObjId);
  const connectingFromStateId = useEditorStore((s) => s.connectingFromStateId);
  const connectingTrigger = useEditorStore((s) => s.connectingTrigger);
  const cancelConnecting = useEditorStore((s) => s.cancelConnecting);
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
      {!isInRoom && (
        <>
          <Platform lightTarget={lightTarget} />
          <Hover
            hoverTargetRef={sunHoverTargetRef as RefObject<Object3D | null>}
          >
            {(hovered) => (
              <>
                <StripedLineToCenter
                  color={hovered ? "white" : "gray"}
                  width={hovered ? 0.008 : 0.005}
                  fromRef={lightGroupRef as RefObject<Object3D | null>}
                />
                <HandleTarget ref={lightGroupRef as RefObject<Object3D | null>}>
                  <primitive object={light} />
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
                </HandleTarget>
              </>
            )}
          </Hover>
        </>
      )}
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

      {Object.entries(objects).map(([id, obj]) => (
        <CustomTransformHandles key={id} objectId={id}>
          <Hover>
            {(hovered) => {
              const baseColor =
                obj.type === "sphere"
                  ? "salmon"
                  : obj.type === "cube"
                    ? "orangered"
                    : "brown";
              const isSel = selectedObjId === id;
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
                  position={objState.transform.position}
                  rotation={objState.transform.rotation}
                  scale={
                    objState.transform.scale.map(
                      (s) => s * 0.02,
                    ) as Vector3Tuple
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      isConnecting &&
                      connectingFromObjId === selectedObjId &&
                      connectingFromStateId
                    ) {
                      // Finalize connection: set transitionTo on from-state to this state's id
                      useSceneStore.setState(
                        produce((sceneData: SceneData) => {
                          if (!selectedObjId) return;
                          const objStates =
                            sceneData.content[selectedObjId]?.states;
                          if (!objStates || objStates.length === 0) return;
                          const fromIdx = objStates.findIndex(
                            (s) => s.id === connectingFromStateId,
                          );
                          const from = objStates[fromIdx];
                          if (!from) return;
                          from.transitionTo = objState.id;
                          from.trigger = connectingTrigger || "click";
                        }),
                      );
                      cancelConnecting();
                      return;
                    }
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
        visible={isEditMode && selectedObjId != null && objStates.length > 1}
      >
        {objStates.map((fromState, i) => {
          const toIndex = fromState.transitionTo
            ? objStates.findIndex((s) => s.id === fromState.transitionTo)
            : -1;
          if (toIndex < 0) return null;
          const toState = objStates[toIndex];
          const isReciprocal = toState.transitionTo === fromState.id;
          const startArr = fromState.transform.position;
          const endArr = toState.transform.position;
          if (isReciprocal) {
            const start = new Vector3(...startArr);
            const end = new Vector3(...endArr);
            const mid = start.clone().add(end).multiplyScalar(0.5);
            const dir = end.clone().sub(start);
            const up = new Vector3(0, 1, 0);
            const alt = new Vector3(1, 0, 0);
            const dirNorm = dir.clone().normalize();
            const base = Math.abs(dirNorm.dot(up)) > 0.99 ? alt : up;
            let perp = dir.clone().cross(base);
            if (perp.lengthSq() < 1e-8) {
              // Fallback if dir is degenerate
              perp = new Vector3(0, 0, 1);
            } else {
              perp.normalize();
            }
            const offsetMag = Math.max(
              0.05,
              Math.min(0.08, dir.length() * 0.1),
            );
            const midOffset = mid.add(perp.multiplyScalar(offsetMag));
            return (
              <QuadraticBezierLine
                key={`obj-state-curve-${selectedObjId ?? "none"}-${i}-to-${toIndex}`}
                start={startArr}
                end={endArr}
                mid={[midOffset.x, midOffset.y, midOffset.z]}
                color={getTransitionColor(fromState.trigger)}
                lineWidth={1}
                dashed={false}
              />
            );
          }
          return (
            <Line
              key={`obj-state-line-${selectedObjId ?? "none"}-${i}-to-${toIndex}`}
              points={[startArr, endArr]}
              color={getTransitionColor(fromState.trigger)}
              lineWidth={1}
              dashed={false}
            />
          );
        })}

        {objStates.map((objState, i) => {
          const selectedObjStateIdx = selectedObjId
            ? (objStateIdxMap[selectedObjId] ?? 0)
            : 0;
          if (i === selectedObjStateIdx) return null;
          return (
            <Billboard
              key={`obj-state-label-${selectedObjId ?? "none"}-${i}`}
              position={[
                objState.transform.position[0],
                objState.transform.position[1] + 0.035,
                objState.transform.position[2],
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
