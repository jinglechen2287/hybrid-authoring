import { useHover } from "@react-three/xr";
import { type ReactNode, type RefObject, useRef, useState } from "react";
import { Group, Object3D } from "three";
import { vibrateOnEvent } from "~/util";

export default function Hover({
  children,
  hoverTargetRef,
}: {
  hoverTargetRef?: RefObject<Object3D | null>;
  children?: (hovered: boolean) => ReactNode;
}) {
  const ref = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  useHover(
    hoverTargetRef ?? (ref as RefObject<Object3D | null>),
    (hoverd, e) => {
      setHovered(hoverd);
      if (hoverd) {
        vibrateOnEvent(e);
      }
    }
  );
  return <group ref={ref}>{children?.(hovered)}</group>;
}
