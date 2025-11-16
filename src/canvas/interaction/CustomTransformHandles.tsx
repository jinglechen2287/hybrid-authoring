import { defaultApply, type HandleState } from "@pmndrs/handle";
import { useFrame } from "@react-three/fiber";
import { Handle, HandleTarget, PivotHandles } from "@react-three/handle";
import { useHover, useXR } from "@react-three/xr";
import { produce } from "immer";
import {
  forwardRef,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Group, Object3D, type Vector3Tuple } from "three";
import { useEditorStore, useSceneStore } from "~/stores";
import type { ObjState, SceneData, Transform, TriggerType } from "~/types";
import { vibrateOnEvent } from "./vibrateOnEvent";

export function CustomTransformHandles({
  objectId,
  children,
  size,
}: {
  size?: number;
  objectId: string;
  children?: ReactNode;
}) {
  const isInXR = useXR((s) => s.session != null);
  const mode = useEditorStore((s) => s.mode);
  const targetRef = useRef<Group>(null);

  const hoveredRef = useRef<boolean>(false);
  const currentIdxRef = useRef<number>(0);
  const activeLerpRef = useRef<
    | {
        from: Transform;
        to: Transform;
        start: number;
        duration: number;
      }
    | null
  >(null);
  const lastStatesSnapshotRef = useRef<number>(0);
  useEffect(() => {
    const updateTarget = ({ position, rotation, scale }: Transform) => {
      if (targetRef.current == null) {
        return;
      }
      targetRef.current.position.fromArray(position);
      targetRef.current.rotation.fromArray(rotation);
      targetRef.current.scale.fromArray(scale);
    };
    const refresh = () => {
      const { selectedObjId, objStateIdxMap } = useEditorStore.getState();
      const sceneState = useSceneStore.getState();
      const objStates = sceneState.content[objectId]?.states ?? [];
      const objStateIdx =
        selectedObjId === objectId ? (objStateIdxMap[objectId] ?? 0) : 0;
      const objState = Array.isArray(objStates)
        ? (objStates[objStateIdx])
        : undefined;
      if (objState) updateTarget(objState.transform);
    };
    refresh();
    const unsubScene = useSceneStore.subscribe(() => refresh());
    const unsubEditor = useEditorStore.subscribe(() => refresh());
    return () => {
      unsubScene();
      unsubEditor();
    };
  }, [isInXR, objectId, mode]);

  // Play-mode: trigger-driven transitions with interpolation
  useFrame(() => {
    if (mode !== "play" || targetRef.current == null) {
      activeLerpRef.current = null;
      return;
    }
    const state = useSceneStore.getState();
    const objStates = (state.content[objectId]?.states ?? []);
    if (!Array.isArray(objStates) || objStates.length === 0) {
      activeLerpRef.current = null;
      return;
    }
    // If states length changed (add/remove), snap to current index within bounds
    if (lastStatesSnapshotRef.current !== objStates.length) {
      const idx = Math.min(currentIdxRef.current, objStates.length - 1);
      currentIdxRef.current = Math.max(0, idx);
      activeLerpRef.current = null;
      lastStatesSnapshotRef.current = objStates.length;
      const current = objStates[currentIdxRef.current]?.transform;
      if (current) {
        targetRef.current.position.fromArray(current.position);
        targetRef.current.rotation.fromArray(current.rotation);
        targetRef.current.scale.fromArray(current.scale);
      }
    }
    const now = performance.now();
    const active = activeLerpRef.current;
    if (active) {
      const progress = Math.min(1, (now - active.start) / active.duration);
      const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
      const lerpVec3 = (a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple => [
        lerp(a[0], b[0], t),
        lerp(a[1], b[1], t),
        lerp(a[2], b[2], t),
      ];
      const pos = lerpVec3(active.from.position, active.to.position, progress);
      const rot = lerpVec3(active.from.rotation, active.to.rotation, progress);
      const scale = lerpVec3(active.from.scale, active.to.scale, progress);
      targetRef.current.position.fromArray(pos);
      targetRef.current.rotation.fromArray(rot);
      targetRef.current.scale.fromArray(scale);
      if (progress >= 1) {
        // Arrived at target state
        const nextIdx = Math.max(
          0,
          Math.min(
            (useSceneStore.getState().content[objectId]?.states?.length ?? 1) -
              1,
            objStates.findIndex((s) => s.transform === active.to),
          ),
        );
        currentIdxRef.current = nextIdx >= 0 ? nextIdx : currentIdxRef.current;
        activeLerpRef.current = null;
        // Auto trigger follow-up if configured
        const currentState = objStates[currentIdxRef.current];
        if (currentState?.trigger === "auto" && currentState.transitionTo) {
          const idx = objStates.findIndex(
            (s) => s.id === currentState.transitionTo,
          );
          if (idx >= 0) {
            const from = currentState.transform;
            const to = objStates[idx].transform;
            activeLerpRef.current = {
              from,
              to,
              start: performance.now(),
              duration: 1000,
            };
          }
        }
      }
      return;
    }
    // No active transition: ensure we're snapped to current state
    const current = objStates[currentIdxRef.current]?.transform;
    if (current) {
      targetRef.current.position.fromArray(current.position);
      targetRef.current.rotation.fromArray(current.rotation);
      targetRef.current.scale.fromArray(current.scale);
    }
  });

  // Kick off auto transition on entering play mode
  useEffect(() => {
    if (mode !== "play") return;
    const states = (useSceneStore.getState().content[objectId]?.states ?? []) as ObjState[];
    if (states.length === 0) return;
    // Initialize current index from editor selection if available
    const { selectedObjId, objStateIdxMap } = useEditorStore.getState();
    currentIdxRef.current = selectedObjId === objectId ? (objStateIdxMap[objectId] ?? 0) : 0;
    const current = states[currentIdxRef.current];
    if (current?.trigger === "auto" && current.transitionTo) {
      const targetIdx = states.findIndex((s) => s.id === current.transitionTo);
      if (targetIdx >= 0) {
        activeLerpRef.current = {
          from: current.transform,
          to: states[targetIdx].transform,
          start: performance.now(),
          duration: 1000,
        };
      }
    }
  }, [mode, objectId]);

  const maybeTransition = useCallback(
    (trigger: TriggerType) => {
      if (mode !== "play") return;
      const objStates = (useSceneStore.getState().content[objectId]?.states ?? []) as ObjState[];
      const current = objStates[currentIdxRef.current];
      if (!current) return;
      if (current.trigger !== trigger) return;
      const targetIdx = objStates.findIndex((s) => s.id === current.transitionTo);
      if (targetIdx < 0) return;
      const from = current.transform;
      const to = objStates[targetIdx].transform;
      activeLerpRef.current = {
        from,
        to,
        start: performance.now(),
        duration: 1000,
      };
    },
    [mode, objectId],
  );

  const apply = useCallback(
    (state: HandleState<unknown>) => {
      useSceneStore.setState(
        produce((sceneData: SceneData) => {
          const s = useEditorStore.getState();
          const objStates = sceneData.content[objectId]?.states;
          if (!objStates || objStates.length === 0) return;
          const objectStateIdx =
            s.selectedObjId === objectId
              ? (s.objStateIdxMap[objectId] ?? 0)
              : 0;
          const target = objStates[objectStateIdx];
          if (!target) return;
          target.transform = {
            position: state.current.position.toArray(),
            rotation: state.current.rotation.toArray() as Vector3Tuple,
            scale: state.current.scale.toArray(),
          };
        }),
      );
    },
    [objectId],
  );
  // In play mode, do not render any interactive handles or selection
  if (mode === "play") {
    return (
      <group
        ref={targetRef as RefObject<Object3D | null>}
        onClick={() => maybeTransition("click")}
        onPointerOver={() => {
          if (!hoveredRef.current) {
            hoveredRef.current = true;
            maybeTransition("hoverStart");
          }
        }}
        onPointerOut={() => {
          if (hoveredRef.current) {
            hoveredRef.current = false;
            maybeTransition("hoverEnd");
          }
        }}
      >
        {children}
      </group>
    );
  }
  if (isInXR) {
    return (
      <HandleTarget ref={targetRef as RefObject<Object3D | null>}>
        <group
          onClick={() => useEditorStore.getState().setSelectedObjId(objectId)}
        >
          <Handle targetRef="from-context" apply={apply}>
            {children}
          </Handle>
        </group>
      </HandleTarget>
    );
  }
  return (
    <SelectablePivotHandles
      size={size}
      objectId={objectId}
      apply={apply}
      ref={targetRef}
    >
      {children}
    </SelectablePivotHandles>
  );
}

const SelectablePivotHandles = forwardRef<
  Group,
  {
    size?: number;
    objectId: string;
    apply?: (state: HandleState<unknown>, target: Object3D) => unknown;
    children?: ReactNode;
  }
>(({ children, size, apply, objectId }, ref) => {
  const isSelected = useEditorStore(
    (state) => state.selectedObjId === objectId,
  );
  const groupRef = useRef<Group>(null);
  useHover(groupRef as RefObject<Object3D | null>, (hover, e) => {
    if (hover) {
      vibrateOnEvent(e);
    }
  });
  return (
    <group
      ref={groupRef}
      onClick={() => useEditorStore.getState().setSelectedObjId(objectId)}
    >
      <PivotHandles
        size={size}
        hidden={!isSelected}
        apply={(state, target) => (apply ?? defaultApply)(state, target)}
        ref={ref}
      >
        {children}
      </PivotHandles>
    </group>
  );
});
