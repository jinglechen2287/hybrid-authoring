import { IfInSessionMode } from "@react-three/xr";
import { BackSide } from "three";

export default function SceneBg() {
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
