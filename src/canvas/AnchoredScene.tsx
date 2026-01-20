import type { XRAnchorOptions } from "@pmndrs/xr";
import { useXR, useXRAnchor, useXRHitTest, XRSpace } from "@react-three/xr";
import { useEffect, useRef } from "react";
import { Group, Quaternion, Vector3 } from "three";
import Scene from "./scene/Scene";

export function AnchoredScene() {
  const [anchor, requestAnchor] = useXRAnchor();
  const isInSession = useXR((state) => !!state.session);

  // If not in an XR session, render the scene normally.
  if (!isInSession) {
    return <Scene />;
  }

  // If anchored, render the scene in the anchor's space.
  if (anchor) {
    return (
      <XRSpace space={anchor.anchorSpace}>
        <Scene />
      </XRSpace>
    );
  }

  // Otherwise, enter placement mode.
  return <PlacementMode requestAnchor={requestAnchor} />;
}

type RequestAnchorFn = (options: XRAnchorOptions) => Promise<XRAnchor | undefined>;

function PlacementMode({
  requestAnchor,
}: {
  requestAnchor: RequestAnchorFn;
}) {
  const ref = useRef<Group>(null);
  const session = useXR((s) => s.session);

  // Perform hit testing from the viewer to detect planes/meshes.
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (!ref.current) return;

      if (results.length > 0) {
        // Update the group's matrix to match the hit test result
        getWorldMatrix(ref.current.matrix, results[0]);
        ref.current.visible = true;
      } else {
        ref.current.visible = false;
      }
    },
    "viewer",
    ["plane", "mesh"],
  );

  useEffect(() => {
    if (!session) return;

    const onSelect = () => {
      if (ref.current && ref.current.visible) {
        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();

        // Decompose the matrix to get position and rotation
        ref.current.matrix.decompose(position, quaternion, scale);

        // Request an anchor at the hit location
        requestAnchor({
          relativeTo: "world",
          worldPosition: position,
          worldQuaternion: quaternion,
        });
      }
    };

    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [session, requestAnchor]);

  return (
    <group ref={ref} matrixAutoUpdate={false} visible={false}>
      <Reticle />
    </group>
  );
}

function Reticle() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}
