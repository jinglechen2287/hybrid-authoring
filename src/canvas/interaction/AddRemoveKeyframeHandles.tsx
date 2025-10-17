import { produce } from "immer";
import { useRef, type RefObject } from "react";
import { Mesh, Object3D } from "three";
import { useSceneStore } from "~/stores";
import type { SceneStore } from "~/types";
import Hover from "./Hover";

export default function AddRemoveKeyframeHandles({
  position = [0.35, 0.08, -0.24] as [number, number, number],
  scale = 1.2,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const addRef = useRef<Mesh>(null);
  const removeRef = useRef<Mesh>(null);
  const selected = useSceneStore((s) => s.selected);
  const selectedKeyframe = useSceneStore((s) => s.selectedKeyframe);
  const EMPTY: [] = [];
  const keyframes = useSceneStore((s) =>
    selected ? (s as SceneStore)[`${selected}Transformation`] : EMPTY,
  );

  const onAdd = () => {
    if (!selected) return;
    useSceneStore.setState(
      produce((draft: SceneStore) => {
        const arr = draft[`${selected}Transformation`];
        const base = arr[selectedKeyframe] ?? arr[arr.length - 1];
        arr.splice(selectedKeyframe + 1, 0, {
          position: [...base.position],
          rotation: [...base.rotation],
          scale: [...base.scale],
        });
        draft.selectedKeyframe = selectedKeyframe + 1;
      }),
    );
  };

  const onRemove = () => {
    if (!selected) return;
    useSceneStore.setState(
      produce((draft: SceneStore) => {
        const arr = draft[`${selected}Transformation`];
        if (arr.length <= 1) return;
        arr.splice(selectedKeyframe, 1);
        if (draft.selectedKeyframe >= arr.length) {
          draft.selectedKeyframe = arr.length - 1;
        }
      }),
    );
  };

  return (
    <group position={position}>
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
            position-y={-0.06}
            scale={hovered ? scale * 0.036 : scale * 0.032}
            onClick={onRemove}
          >
            <mesh scale={[1, 0.4, 0.4]} rotation-y={Math.PI / 2}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : 0}
                emissive={0xffffff}
                toneMapped={false}
                color={keyframes.length <= 1 ? "gray" : "maroon"}
              />
            </mesh>
          </group>
        )}
      </Hover>
    </group>
  );
}
