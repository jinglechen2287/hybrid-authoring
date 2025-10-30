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
import type { SceneData, Transformation } from "~/types";
import { vibrateOnEvent } from "./vibrateOnEvent";

export default function CustomTransformHandles({
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

  const animationStartRef = useRef<number | null>(null);
  const lastObjStateCountRef = useRef<number>(0);
  useEffect(() => {
    const updateTarget = ({ position, rotation, scale }: Transformation) => {
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
      const objState = Array.isArray(objStates) ? objStates[objStateIdx] : undefined;
      if (objState) updateTarget(objState);
    };
    refresh();
    const unsubScene = useSceneStore.subscribe(() => refresh());
    const unsubEditor = useEditorStore.subscribe(() => refresh());
    return () => {
      unsubScene();
      unsubEditor();
    };
  }, [isInXR, objectId, mode]);

  // Play-mode objStates interpolation (500ms per segment), loops across objStates
  useFrame(() => {
    if (mode !== "play" || targetRef.current == null) {
      animationStartRef.current = null;
      return;
    }
    const state = useSceneStore.getState();
    const objStates = state.content[objectId]?.states ?? [];
    if (!Array.isArray(objStates) || objStates.length === 0) {
      animationStartRef.current = null;
      return;
    }
    if (objStates.length === 1) {
      const objState = objStates[0];
      targetRef.current.position.fromArray(objState.position);
      targetRef.current.rotation.fromArray(objState.rotation);
      targetRef.current.scale.fromArray(objState.scale);
      animationStartRef.current = null;
      lastObjStateCountRef.current = 1;
      return;
    }
    const { selectedObjId } = useEditorStore.getState();
    if (!selectedObjId || selectedObjId === objectId) {
      // reset animation start if objState count changed
      if (lastObjStateCountRef.current !== objStates.length) {
        animationStartRef.current = null;
        lastObjStateCountRef.current = objStates.length;
      }
      const now = performance.now();
      if (animationStartRef.current == null) {
        animationStartRef.current = now;
      }
      const objStateSegmentDurationMs = 1000;
      const totalSegments = objStates.length - 1;
      const totalDurationMs = totalSegments * objStateSegmentDurationMs;
      const elapsedMs = (now - animationStartRef.current) % totalDurationMs;
      const objStateSegmentIdx = Math.floor(
        elapsedMs / objStateSegmentDurationMs,
      );
      const progress =
        (elapsedMs % objStateSegmentDurationMs) / objStateSegmentDurationMs;
      const prevObjState = objStates[objStateSegmentIdx];
      const nextObjState = objStates[objStateSegmentIdx + 1];
      const lerp = (x: number, y: number, progress: number) =>
        x + (y - x) * progress;
      const lerpVec3 = (
        prevValue: Vector3Tuple,
        nextValue: Vector3Tuple,
        progress: number,
      ): Vector3Tuple => [
        lerp(prevValue[0], nextValue[0], progress),
        lerp(prevValue[1], nextValue[1], progress),
        lerp(prevValue[2], nextValue[2], progress),
      ];
      const pos = lerpVec3(
        prevObjState.position,
        nextObjState.position,
        progress,
      );
      const rot = lerpVec3(
        prevObjState.rotation,
        nextObjState.rotation,
        progress,
      );
      const scale = lerpVec3(prevObjState.scale, nextObjState.scale, progress);
      targetRef.current.position.fromArray(pos);
      targetRef.current.rotation.fromArray(rot);
      targetRef.current.scale.fromArray(scale);
    }
  });

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
          objStates[objectStateIdx] = {
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
      <group ref={targetRef as RefObject<Object3D | null>}>{children}</group>
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
