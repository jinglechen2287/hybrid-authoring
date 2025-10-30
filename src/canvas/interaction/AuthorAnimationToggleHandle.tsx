import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import { Mesh, Object3D } from "three";
import { useEditorStore } from "~/stores";
import Hover from "./Hover";
import { useSceneStore } from "~/stores";

export default function AuthorAnimationToggleHandle({
  position = [0.35, -0.05, -0.24] as [number, number, number],
  scale = 1.2,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const isAuthoringAnimation = useEditorStore((s) => s.isAuthoringAnimation);
  const setIsAuthoringAnimation = useEditorStore(
    (s) => s.setIsAuthoringAnimation,
  );

  useFrame(() => {
    if (meshRef.current == null) return;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <group
      position={position}
      onClick={() => {
        setIsAuthoringAnimation(!isAuthoringAnimation);
        useSceneStore.setState({ selectedKeyframe: 0 });
      }}
    >
      <Hover hoverTargetRef={meshRef as RefObject<Object3D | null>}>
        {(hovered) => (
          <mesh ref={meshRef} scale={hovered ? scale * 0.025 : scale * 0.02}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              emissiveIntensity={hovered ? 0.3 : 0}
              emissive={isAuthoringAnimation ? "deepskyblue" : 0xffffff}
              toneMapped={false}
              color={isAuthoringAnimation ? "deepskyblue" : "gray"}
            />
          </mesh>
        )}
      </Hover>
    </group>
  );
}
