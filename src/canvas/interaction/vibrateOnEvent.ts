import { isXRInputSourceState } from "@react-three/xr";
import { PointerEvent } from "@pmndrs/pointer-events";

export function vibrateOnEvent(e: PointerEvent) {
  if (
    isXRInputSourceState(e.pointerState) &&
    e.pointerState.type === "controller"
  ) {
    e.pointerState.inputSource.gamepad?.hapticActuators[0]?.pulse(0.3, 50);
  }
}
