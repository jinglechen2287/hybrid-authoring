import { defaultApply, type HandleState } from "@pmndrs/handle";
import { Handle, HandleTarget, PivotHandles } from "@react-three/handle";
import { useHover, useXR } from "@react-three/xr";
import {
  forwardRef,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Group, Object3D } from "three";
import { useSceneStore } from "~/stores";
import { createDefaultTransformation, vibrateOnEvent } from "~/util";
import type { ElementType } from "~/types";

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
  const targetRef = useRef<Group>(null);
  useEffect(() => {
    const fn = ({
      position,
      rotation,
      scale,
    }: ReturnType<typeof createDefaultTransformation>) => {
      if (targetRef.current == null) {
        return;
      }
      targetRef.current.position.fromArray(position);
      targetRef.current.rotation.fromArray(rotation);
      targetRef.current.scale.fromArray(scale);
    };
    fn(useSceneStore.getState()[`${target}Transformation`]);
    return useSceneStore.subscribe((state) =>
      fn(state[`${target}Transformation`])
    );
  }, [isInXR, target]);
  const apply = useCallback(
    (state: HandleState<unknown>) => {
      useSceneStore.setState({
        [`${target}Transformation`]: {
          position: state.current.position.toArray(),
          rotation: state.current.rotation.toArray(),
          scale: state.current.scale.toArray(),
        },
      });
    },
    [target]
  );
  if (isInXR) {
    return (
      <HandleTarget ref={targetRef as RefObject<Object3D | null>}>
        <Handle targetRef="from-context" apply={apply}>
          {children}
        </Handle>
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
      onClick={() => useSceneStore.setState({ selected: target })}
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
