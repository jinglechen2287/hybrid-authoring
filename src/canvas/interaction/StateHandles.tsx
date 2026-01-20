import { produce } from "immer";
import { Billboard, Text } from "@react-three/drei";
import { type RefObject, useRef } from "react";
import { Mesh, Object3D } from "three";
import {
  EMISSIVE,
  FONT_SIZES,
  SCALES,
  TRIGGER_COLORS,
  TRIGGER_ORDER,
} from "~/constants";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData, TriggerType } from "~/types";
import { playConfirmSound } from "~/utils/audio";
import { addObjState, removeObjState, getObjStateIdx } from "~/utils/stateOperations";
import { Hover } from "./Hover";

export function StateHandles({
  position = [0.35, -0.05, -0.26] as [number, number, number],
  scale = 1.2,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const addRef = useRef<Mesh | null>(null);
  const removeRef = useRef<Mesh | null>(null);
  const connectRef = useRef<Mesh | null>(null);
  const selectedObjId = useEditorStore((s) => s.selectedObjId);
  const objStateIdxMap = useEditorStore((s) => s.objStateIdxMap);
  const setObjStateIdxMap = useEditorStore((s) => s.setObjStateIdxMap);
  const isConnecting = useEditorStore((s) => s.isConnecting);
  const setConnectingFrom = useEditorStore((s) => s.setConnectingFrom);
  const setConnectingTrigger = useEditorStore((s) => s.setConnectingTrigger);
  const connectingTrigger = useEditorStore((s) => s.connectingTrigger);
  const connectingFromObjId = useEditorStore((s) => s.connectingFromObjId);
  const connectingFromStateId = useEditorStore((s) => s.connectingFromStateId);
  const cancelConnecting = useEditorStore((s) => s.cancelConnecting);
  const EMPTY: [] = [];
  const states = useSceneStore((s) =>
    selectedObjId ? (s.content[selectedObjId]?.states ?? EMPTY) : EMPTY,
  );
  const selectedObjStateIdx = getObjStateIdx(objStateIdxMap, selectedObjId);

  const onAdd = () => {
    if (!selectedObjId) return;
    const newIdx = addObjState(selectedObjId, selectedObjStateIdx);
    setObjStateIdxMap(newIdx);
    playConfirmSound();
  };

  const onRemove = () => {
    if (!selectedObjId) return;
    const newIdx = removeObjState(selectedObjId, selectedObjStateIdx);
    setObjStateIdxMap(newIdx);
    playConfirmSound();
  };

  const onStartConnect = () => {
    if (!selectedObjId) return;
    const fromState = states[selectedObjStateIdx];
    if (!fromState) return;
    if (!isConnecting) {
      setConnectingFrom(selectedObjId, fromState.id);
    } else {
      const idx = TRIGGER_ORDER.indexOf(connectingTrigger);
      const next = TRIGGER_ORDER[(idx + 1) % TRIGGER_ORDER.length];
      if (next === "") {
        // Exit connect mode and remove existing transition on the from-state
        if (connectingFromObjId && connectingFromStateId) {
          useSceneStore.setState(
            produce((sceneData: SceneData) => {
              const objStates = sceneData.content[connectingFromObjId!]?.states;
              if (!objStates) return;
              const fromIdx = objStates.findIndex(
                (s) => s.id === connectingFromStateId,
              );
              const s = objStates[fromIdx];
              if (s) {
                s.transitionTo = "";
                s.trigger = "" as TriggerType;
              }
            }),
          );
        }
        cancelConnecting();
      } else {
        setConnectingTrigger(next);
      }
    }
    playConfirmSound();
  };

  return (
    <group position={position} visible={selectedObjId != null}>
      <Hover hoverTargetRef={addRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <group
            ref={addRef}
            scale={hovered ? scale * SCALES.STATE_HANDLE.hover : scale * SCALES.STATE_HANDLE.default}
            rotation-z={Math.PI / 2}
            onClick={onAdd}
          >
            <mesh scale={[1, 0.4, 0.4]}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                emissive={0xffffff}
                toneMapped={false}
                color={"lightgreen"}
              />
            </mesh>
            <mesh scale={[1, 0.4, 0.4]} rotation-y={Math.PI / 2}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                emissive={0xffffff}
                toneMapped={false}
                color={"lightgreen"}
              />
            </mesh>
          </group>
        )}
      </Hover>
      <Hover hoverTargetRef={removeRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <group
            ref={removeRef}
            position-z={0.07}
            scale={hovered ? scale * SCALES.STATE_HANDLE.hover : scale * SCALES.STATE_HANDLE.default}
            onClick={onRemove}
          >
            <mesh scale={[1, 0.4, 0.4]} rotation-y={Math.PI / 2}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                emissive={0xffffff}
                toneMapped={false}
                color={states.length <= 1 ? "gray" : "maroon"}
              />
            </mesh>
          </group>
        )}
      </Hover>
      <Hover hoverTargetRef={connectRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <group
            ref={connectRef}
            position-z={0.14}
            scale={hovered ? scale * SCALES.CONNECT_HANDLE.hover : scale * SCALES.CONNECT_HANDLE.default}
            onClick={onStartConnect}
          >
            <mesh>
              <icosahedronGeometry args={[0.5]} />
              <meshStandardMaterial
                emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
                emissive={0xffffff}
                toneMapped={false}
                color={isConnecting ? "deepskyblue" : "gray"}
              />
            </mesh>
            {isConnecting && (
              <Billboard position={[0, 0.9, 0]} follow>
                <Text
                  fontSize={FONT_SIZES.TRIGGER_INDICATOR}
                  color="white"
                  anchorX="center"
                  anchorY="bottom"
                  outlineWidth={0.08}
                  outlineColor="black"
                >
                  {connectingTrigger}
                </Text>
              </Billboard>
            )}
            {isConnecting && (
              <mesh position-y={0.3} scale={0.4}>
                <boxGeometry />
                <meshStandardMaterial
                  toneMapped={false}
                  color={TRIGGER_COLORS[connectingTrigger] || TRIGGER_COLORS.auto}
                />
              </mesh>
            )}
          </group>
        )}
      </Hover>
    </group>
  );
}
