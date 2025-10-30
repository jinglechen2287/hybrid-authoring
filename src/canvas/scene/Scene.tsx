import { RoundedBox } from "@react-three/drei";
import { Handle, HandleTarget } from "@react-three/handle";
import { useEditorStore } from "~/stores";
import { RotateGeometry } from "../customGeometries";
import AddRemoveKeyframeHandles from "../interaction/AddRemoveKeyframeHandles";
import AuthorAnimationToggleHandle from "../interaction/AuthorAnimationToggleHandle";
import Hover from "../interaction/Hover";
import ModeToggleHandle from "../interaction/ModeToggleHandle";
import SceneContent from "./SceneContent";

export default function Scene({
  isInScreen = false,
}: {
  isInScreen?: boolean;
}) {
  const isAuthoringAnimation = useEditorStore((s) => s.isAuthoringAnimation);
  return (
    <HandleTarget>
      <SceneContent isInScreen={isInScreen} />
      <SceneTransformHandles />
      <SceneRotateAndScaleHandles />
      <ModeToggleHandle />
      <AuthorAnimationToggleHandle />
      {isAuthoringAnimation && <AddRemoveKeyframeHandles />}
      {/* <CameraHelper /> */}
    </HandleTarget>
  );
}

function SceneTransformHandles() {
  return (
    <Handle
      targetRef="from-context"
      scale={false}
      multitouch={false}
      rotate={false}
    >
      <Hover>
        {(hovered) => (
          <RoundedBox
            position-x={0.35}
            position-y={-0.05}
            args={[0.2, 0.2, 2]}
            scale={hovered ? 0.125 : 0.1}
          >
            <meshStandardMaterial
              emissiveIntensity={hovered ? 0.3 : 0}
              emissive={0xffffff}
              toneMapped={false}
              color="grey"
            />
          </RoundedBox>
        )}
      </Hover>
    </Handle>
  );
}

function SceneRotateAndScaleHandles() {
  return (
    <Handle
      targetRef="from-context"
      scale={{ uniform: true }}
      multitouch={false}
      translate="as-rotate-and-scale"
      rotate={{ x: false, z: false }}
    >
      <Hover>
        {(hovered) => (
          <mesh
            position-x={0.335}
            position-z={0.335}
            position-y={-0.05}
            rotation-y={Math.PI}
            scale={hovered ? 0.04 : 0.03}
          >
            <RotateGeometry />
            <meshStandardMaterial
              emissiveIntensity={hovered ? 0.3 : 0}
              emissive={0xffffff}
              toneMapped={false}
              color="grey"
            />
          </mesh>
        )}
      </Hover>
    </Handle>
  );
}
