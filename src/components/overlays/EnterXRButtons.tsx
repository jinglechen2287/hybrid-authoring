import type { CSSProperties } from "react";
import { xrStore } from "~/stores";

const buttonStyles: CSSProperties = {
  background: "white",
  border: "none",
  color: "black",
  padding: "0.5rem 1.5rem",
  cursor: "pointer",
  fontSize: "1.5rem",
  fontFamily: "monospace",
  bottom: "1rem",
  left: "50%",
  boxShadow: "0px 0px 20px rgba(0, 0, 0, 0.2)",
};

export default function EnterXRButtons() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        left: "50%",
        transform: "translate(-50%, 0)",
        bottom: "1rem",
        gap: "1rem",
        zIndex: "10000",
      }}
    >
      <button style={buttonStyles} onClick={() => xrStore.enterVR()}>
        VR
      </button>
      <button style={buttonStyles} onClick={() => xrStore.enterAR()}>
        AR
      </button>
    </div>
  );
}
