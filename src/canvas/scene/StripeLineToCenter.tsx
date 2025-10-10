import { type Color, extend, useFrame } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { type RefObject, useRef } from "react";
import { Mesh, Object3D, Vector3 } from "three";

extend({ MeshLineGeometry, MeshLineMaterial });
const vectorHelper1 = new Vector3();
const vectorHelper2 = new Vector3();
const zAxis = new Vector3(0, 0, 1);

export default function StripedLineToCenter({
  fromRef,
  width,
  color,
}: {
  fromRef: RefObject<Object3D | null>;
  width: number;
  color: Color;
}) {
  const ref = useRef<Mesh>(null);
  const materialRef = useRef<MeshLineMaterial>(null);
  useFrame(() => {
    if (
      ref.current == null ||
      fromRef.current == null ||
      materialRef.current == null
    ) {
      return;
    }
    const p1 = vectorHelper1.copy(fromRef.current.position);
    const p2 = vectorHelper2.set(0, 0, 0);
    materialRef.current.dashArray = (0.8 / p1.distanceTo(p2)) * 0.02;
    ref.current.position.copy(p1);
    p2.sub(p1);
    const length = p2.length();
    ref.current.quaternion.setFromUnitVectors(zAxis, p2.divideScalar(length));
    ref.current.scale.setScalar(length);
  });
  return (
    <mesh ref={ref}>
      {/* @ts-expect-error ignore */}
      <meshLineGeometry points={[0, 0, 0, 0, 0, 1]} />
      {/*@ts-expect-error ignore*/}
      <meshLineMaterial
        ref={materialRef}
        lineWidth={width}
        dashArray={0.03}
        opacity={0.5}
        transparent
        color={color}
      />
    </mesh>
  );
}
