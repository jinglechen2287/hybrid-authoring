import { Canvas as R3FCanvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitHandles } from "@react-three/handle";
import {
  IfInSessionMode,
  noEvents,
  PointerEvents,
  useXR,
  useXRPlanes,
  XR,
  XROrigin,
} from "@react-three/xr";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, Matrix4, Quaternion, Vector3 } from "three";
import { CAMERA_CONFIG, CANVAS_STYLE } from "~/constants";
import { cameraStore, xrStore } from "~/stores";
import { useRoomStore } from "~/stores/roomStore";
import { patchRoomData } from "~/supabase/roomData";
import type { RoomPlaneData } from "~/types";
import Scene from "./scene/Scene";
import SceneContent from "./scene/SceneContent";

export default function Canvas() {
  return (
    <R3FCanvas
      shadows="soft"
      camera={CAMERA_CONFIG}
      events={noEvents}
      style={CANVAS_STYLE}
    >
      <XR store={xrStore}>
        <CanvasBg />
        <group>
          <PointerEvents />
          <OrbitHandles damping store={cameraStore} />
          <XROrigin />
          <Scene />
          <Room />
        </group>
      </XR>
    </R3FCanvas>
  );
}

function CanvasBg() {
  return (
    // Hide in immersive AR
    <IfInSessionMode deny="immersive-ar">
      <mesh scale={1000}>
        <meshBasicMaterial side={BackSide} color="black" />
        <sphereGeometry />
      </mesh>
    </IfInSessionMode>
  );
}

function Room() {
  const xrPlanes = useXRPlanes();
  const mode = useXR((s) => s.mode);
  const isImmersive = mode === "immersive-ar";
  const needsUpdate = useRef(false);
  const gl = useThree((s) => s.gl);
  const { setPlanes, planes } = useRoomStore();

  const contentMatrix = useMemo(() => {
    const floor = planes.find((p) => p.semanticLabel === "floor");
    if (!floor) return new Matrix4();

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

    const miniMatrix = new Matrix4().compose(
      pos,
      invQuat,
      new Vector3(s, s, s),
    );
    return miniMatrix.invert();
  }, [planes]);

  useEffect(() => {
    if (isImmersive) {
      needsUpdate.current = true;
    }
  }, [xrPlanes, isImmersive]);

  useFrame((_state, _delta, frame?: XRFrame) => {
    if (!isImmersive || !needsUpdate.current || !frame) return;

    const referenceSpace = gl.xr.getReferenceSpace();
    if (!referenceSpace) return;

    const newRoomData: RoomPlaneData[] = [];

    xrPlanes.forEach((plane) => {
      const pose = frame.getPose(plane.planeSpace, referenceSpace);
      if (pose) {
        newRoomData.push({
          id: `plane-${newRoomData.length}`, // Simple ID generation
          semanticLabel: plane.semanticLabel,
          orientation: plane.orientation,
          poseMatrix: Array.from(pose.transform.matrix),
          polygon: plane.polygon.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        });
      }
    });

    if (newRoomData.length > 0) {
      setPlanes(newRoomData);
      patchRoomData();
    }
    needsUpdate.current = false;
  });

  if (isImmersive) {
    return (
      <>
        <group matrix={contentMatrix} matrixAutoUpdate={false}>
          <SceneContent isInRoom={true} />
        </group>
        {/* {xrPlanes.map((plane, index) => (
          <XRSpace key={index} space={plane.planeSpace}>
            <XRPlaneModel plane={plane}>
              <meshBasicMaterial
                color="blue"
                transparent
                opacity={0.4}
                side={2}
              />
            </XRPlaneModel>
            <Text
              position={[0, 0.1, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {plane.semanticLabel || "unknown"}
            </Text>
          </XRSpace>
        ))} */}
      </>
    );
  }

  return <></>;
}
