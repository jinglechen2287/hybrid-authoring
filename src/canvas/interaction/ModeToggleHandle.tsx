import { useRef, type RefObject } from "react";
import { Mesh, Object3D } from "three";
import { EMISSIVE, SCALES } from "~/constants";
import { useEditorStore } from "~/stores";
import { Hover } from "./Hover";

export function ModeToggleHandle({
  position = [0.35, -0.05, -0.33] as [number, number, number],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const mode = useEditorStore((s) => s.mode);
  const toggleMode = useEditorStore((s) => s.toggleMode);

  return (
    <group position={position} onClick={toggleMode}>
      <Hover hoverTargetRef={meshRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <mesh ref={meshRef} scale={hovered ? scale * SCALES.HANDLE_SMALL.hover : scale * SCALES.HANDLE_SMALL.default}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              emissiveIntensity={hovered ? EMISSIVE.ON : EMISSIVE.OFF}
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
