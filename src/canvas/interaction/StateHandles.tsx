import { produce } from "immer";
import { Billboard, Text } from "@react-three/drei";
import { useRef, type RefObject } from "react";
import type { Vector3Tuple } from "three";
import { Mesh, Object3D } from "three";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData, TriggerType } from "~/types";
import Hover from "./Hover";

export default function StateHandles({
  position = [0.35, -0.05, -0.26] as [number, number, number],
  scale = 1.2,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const addRef = useRef<Mesh>(null);
  const removeRef = useRef<Mesh>(null);
  const connectRef = useRef<Mesh>(null);
  const confirmAudioRef = useRef<HTMLAudioElement | null>(null);
  if (confirmAudioRef.current == null) {
    confirmAudioRef.current = new Audio("/confirm.wav");
  }
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
  const selectedObjStateIdx = selectedObjId
    ? (objStateIdxMap[selectedObjId] ?? 0)
    : 0;

  const onAdd = () => {
    if (!selectedObjId) return;
    useSceneStore.setState(
      produce((sceneData: SceneData) => {
        const objStates = sceneData.content[selectedObjId]?.states;
        if (!objStates || objStates.length === 0) return;
        const base =
          objStates[selectedObjStateIdx] ?? objStates[objStates.length - 1];
        const newState = {
          id: uuidv4(),
          transform: {
            position: [...base.transform.position] as Vector3Tuple,
            rotation: [...base.transform.rotation] as Vector3Tuple,
            scale: [...base.transform.scale] as Vector3Tuple,
          },
          trigger: "" as TriggerType,
          transitionTo: "",
        };
        objStates.splice(selectedObjStateIdx + 1, 0, newState);
      }),
    );
    setObjStateIdxMap(selectedObjStateIdx + 1);
    try {
      const a = confirmAudioRef.current;
      if (a) {
        a.currentTime = 0;
        void a.play();
      }
    } catch {
      console.error("Failed to play confirm audio");
    }
  };

  const onRemove = () => {
    if (!selectedObjId) return;
    let nextObjStateIdx = selectedObjStateIdx;
    useSceneStore.setState(
      produce((sceneData: SceneData) => {
        const objStates = sceneData.content[selectedObjId]?.states;
        if (!objStates || objStates.length <= 1) return;
        objStates.splice(selectedObjStateIdx, 1);
        if (nextObjStateIdx >= objStates.length) {
          nextObjStateIdx = objStates.length - 1;
        }
      }),
    );
    setObjStateIdxMap(nextObjStateIdx);
    try {
      const a = confirmAudioRef.current;
      if (a) {
        a.currentTime = 0;
        void a.play();
      }
    } catch {
      console.error("Failed to play confirm audio");
    }
  };

  const onStartConnect = () => {
    if (!selectedObjId) return;
    const fromState = states[selectedObjStateIdx];
    if (!fromState) return;
    if (!isConnecting) {
      setConnectingFrom(selectedObjId, fromState.id);
    } else {
      const order: TriggerType[] = [
        "click",
        "hoverStart",
        "hoverEnd",
        "auto",
        "",
      ];
      const idx = order.indexOf(connectingTrigger);
      const next = order[(idx + 1) % order.length];
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
    try {
      const a = confirmAudioRef.current;
      if (a) {
        a.currentTime = 0;
        void a.play();
      }
    } catch {
      console.error("Failed to play confirm audio");
    }
  };

  return (
    <group position={position} visible={selectedObjId != null}>
      <Hover hoverTargetRef={addRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <group
            ref={addRef}
            scale={hovered ? scale * 0.036 : scale * 0.032}
            rotation-z={Math.PI / 2}
            onClick={onAdd}
          >
            <mesh scale={[1, 0.4, 0.4]}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : 0}
                emissive={0xffffff}
                toneMapped={false}
                color={"lightgreen"}
              />
            </mesh>
            <mesh scale={[1, 0.4, 0.4]} rotation-y={Math.PI / 2}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : 0}
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
            scale={hovered ? scale * 0.036 : scale * 0.032}
            onClick={onRemove}
          >
            <mesh scale={[1, 0.4, 0.4]} rotation-y={Math.PI / 2}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : 0}
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
            scale={hovered ? scale * 0.042 : scale * 0.038}
            onClick={onStartConnect}
          >
            <mesh>
              <icosahedronGeometry args={[0.5]} />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : 0}
                emissive={0xffffff}
                toneMapped={false}
                color={isConnecting ? "deepskyblue" : "gray"}
              />
            </mesh>
            {isConnecting && (
              <Billboard position={[0, 0.9, 0]} follow>
                <Text
                  fontSize={0.5}
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
                  color={
                    connectingTrigger === "click"
                      ? "orangered"
                      : connectingTrigger === "hoverStart"
                        ? "skyblue"
                        : connectingTrigger === "hoverEnd"
                          ? "green"
                          : "white"
                  }
                />
              </mesh>
            )}
          </group>
        )}
      </Hover>
    </group>
  );
}
