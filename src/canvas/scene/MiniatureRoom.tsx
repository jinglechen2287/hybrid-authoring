import { Text } from "@react-three/drei";
import { useMemo } from "react";
import { Matrix4, Quaternion, Shape, Vector3 } from "three";
import { useRoomStore } from "~/stores";
import type { RoomPlaneData } from "~/types";

export function MiniatureRoom() {
  const { planes } = useRoomStore();

  const { position: groupPosition, quaternion: groupQuaternion } =
    useMemo(() => {
      const floor = planes.find((p) => p.semanticLabel === "floor");
      if (!floor)
        return {
          position: new Vector3(0, 0, 0),
          quaternion: new Quaternion(),
        };

      const m = new Matrix4().fromArray(floor.poseMatrix);
      const position = new Vector3();
      const quaternion = new Quaternion();
      const scale = new Vector3();
      m.decompose(position, quaternion, scale);

      // Invert quaternion to align floor with (0, 0, 0) rotation
      const invQuat = quaternion.clone().invert();

      // Flip 180 degrees around Z axis to fix "upside down" orientation
      const flip = new Quaternion().setFromAxisAngle(
        new Vector3(0, 0, 1),
        Math.PI,
      );
      invQuat.premultiply(flip);

      // Transform position: -P, rotated by invQuat, then scaled
      const s = 0.075;
      const pos = position
        .clone()
        .negate()
        .applyQuaternion(invQuat)
        .multiplyScalar(s);

      return { position: pos, quaternion: invQuat };
    }, [planes]);

  return (
    <group scale={0.075} position={groupPosition} quaternion={groupQuaternion}>
      {planes.map((data, i) => (
        <StoredPlane key={i} data={data} />
      ))}
    </group>
  );
}

function StoredPlane({ data }: { data: RoomPlaneData }) {
  const shape = useMemo(() => {
    const s = new Shape();
    if (data.polygon.length > 0) {
      s.moveTo(data.polygon[0].x, data.polygon[0].z);
      for (let i = 1; i < data.polygon.length; i++) {
        s.lineTo(data.polygon[i].x, data.polygon[i].z);
      }
    }
    return s;
  }, [data.polygon]);

  const matrix = useMemo(
    () => new Matrix4().fromArray(data.poseMatrix),
    [data.poseMatrix],
  );

  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <mesh rotation-x={-Math.PI / 2}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color="blue" transparent opacity={0.2} side={2} />
        <Text
            position={[0, 0.1, 0]}
            rotation={[Math.PI, 0, 0]}
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            depthOffset={1}
          >
            {data.semanticLabel || "unknown"}
          </Text>
      </mesh>
    </group>
  );
}
