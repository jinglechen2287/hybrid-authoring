import { useRef, type RefObject } from "react";
import { Mesh, Object3D } from "three";
import { useEditorStore } from "~/stores";
import Hover from "./Hover";

export default function ModeToggleHandle({
  position = [0.35, -0.05, -0.33] as [number, number, number],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const mode = useEditorStore((s) => s.mode);
  const toggleMode = useEditorStore((s) => s.toggleMode);
  const onClick = () => {
    toggleMode();
    useEditorStore.getState().setObjStateIdxMap(0);
    useEditorStore.getState().setSelectedObjId(undefined);
  };

  return (
    <group position={position} onClick={onClick}>
      <Hover hoverTargetRef={meshRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <mesh ref={meshRef} scale={hovered ? scale * 0.025 : scale * 0.02}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              emissiveIntensity={hovered ? 0.3 : 0}
              emissive={mode === "edit" ? 0xffffff : "orange"}
              toneMapped={false}
              color={mode === "edit" ? "gray" : "orange"}
            />
          </mesh>
        )}
      </Hover>
    </group>
  );
}
