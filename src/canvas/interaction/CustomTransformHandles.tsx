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
import { useModeStore, useSceneStore } from "~/stores";
import type { ElementType, Transformation } from "~/types";
import { vibrateOnEvent } from "./vibrateOnEvent";

export default function CustomTransformHandles({
  target,
  children,
  size,
}: {
  size?: number;
  target: ElementType;
  children?: ReactNode;
}) {
  const isInXR = useXR((s) => s.session != null);
  const mode = useModeStore((s) => s.mode);
  const targetRef = useRef<Group>(null);

  const animationStartRef = useRef<number | null>(null);
  const lastKeyframeCountRef = useRef<number>(0);
  useEffect(() => {
    const fn = ({ position, rotation, scale }: Transformation) => {
      if (targetRef.current == null) {
        return;
      }
      targetRef.current.position.fromArray(position);
      targetRef.current.rotation.fromArray(rotation);
      targetRef.current.scale.fromArray(scale);
    };
    const initial = useSceneStore.getState();
    const initialIndex =
      initial.selected === target ? initial.selectedKeyframe : 0;
    const initialArr = initial[`${target}Transformation`];
    if (Array.isArray(initialArr) && initialArr[initialIndex]) {
      fn(initialArr[initialIndex]);
    }
    return useSceneStore.subscribe((state) => {
      const index = state.selected === target ? state.selectedKeyframe : 0;
      const arr = state[`${target}Transformation`];
      const kf = Array.isArray(arr) ? arr[index] : undefined;
      if (kf) fn(kf);
    });
  }, [isInXR, target, mode]);

  // Play-mode keyframe interpolation (500ms per segment), loops across keyframes
  useFrame(() => {
    if (mode !== "play" || targetRef.current == null) {
      animationStartRef.current = null;
      return;
    }
    const state = useSceneStore.getState();
    const keyframes = state[`${target}Transformation`];
    if (!Array.isArray(keyframes) || keyframes.length === 0) {
      animationStartRef.current = null;
      return;
    }
    if (keyframes.length === 1) {
      const kf = keyframes[0];
      targetRef.current.position.fromArray(kf.position);
      targetRef.current.rotation.fromArray(kf.rotation);
      targetRef.current.scale.fromArray(kf.scale);
      animationStartRef.current = null;
      lastKeyframeCountRef.current = 1;
      return;
    }
    if (!state.selected || state.selected === target) {
      // reset animation start if keyframe count changed
      if (lastKeyframeCountRef.current !== keyframes.length) {
        animationStartRef.current = null;
        lastKeyframeCountRef.current = keyframes.length;
      }
      const now = performance.now();
      if (animationStartRef.current == null) {
        animationStartRef.current = now;
      }
      const segmentDurationMs = 1000;
      const totalSegments = keyframes.length - 1;
      const totalDurationMs = totalSegments * segmentDurationMs;
      const elapsedMs = (now - animationStartRef.current) % totalDurationMs;
      const segmentIndex = Math.floor(elapsedMs / segmentDurationMs);
      const progress = (elapsedMs % segmentDurationMs) / segmentDurationMs;
      const prevKeyFrame = keyframes[segmentIndex];
      const nextKeyFrame = keyframes[segmentIndex + 1];
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
        prevKeyFrame.position,
        nextKeyFrame.position,
        progress,
      );
      const rot = lerpVec3(
        prevKeyFrame.rotation,
        nextKeyFrame.rotation,
        progress,
      );
      const scale = lerpVec3(prevKeyFrame.scale, nextKeyFrame.scale, progress);
      targetRef.current.position.fromArray(pos);
      targetRef.current.rotation.fromArray(rot);
      targetRef.current.scale.fromArray(scale);
    }
  });

  const apply = useCallback(
    (state: HandleState<unknown>) => {
      useSceneStore.setState(
        produce((draft) => {
          const s = useSceneStore.getState();
          draft[`${target}Transformation`][
            s.selected === target ? s.selectedKeyframe : 0
          ] = {
            position: state.current.position.toArray(),
            rotation: state.current.rotation.toArray(),
            scale: state.current.scale.toArray(),
          };
        }),
      );
    },
    [target],
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
          onClick={() =>
            useSceneStore.setState({ selected: target, selectedKeyframe: 0 })
          }
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
      target={target}
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
    target: ElementType;
    apply?: (state: HandleState<unknown>, target: Object3D) => unknown;
    children?: ReactNode;
  }
>(({ children, size, apply, target }, ref) => {
  const isSelected = useSceneStore((state) => state.selected === target);
  const groupRef = useRef<Group>(null);
  useHover(groupRef as RefObject<Object3D | null>, (hover, e) => {
    if (hover) {
      vibrateOnEvent(e);
    }
  });
  return (
    <group
      ref={groupRef}
      onClick={() =>
        useSceneStore.setState({ selected: target, selectedKeyframe: 0 })
      }
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
