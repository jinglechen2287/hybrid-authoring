import { useEffect } from "react";
import Canvas from "~/canvas/Canvas";
import GUI from "~/gui/GUI";
import { useEditorStore, xrStore } from "~/stores";
import { startSceneSync } from "~/supabase/subscription";
import { startCameraSync } from "~/supabase/cameraSubscription";
import "./index.css";

const projectId = 1;

export default function App() {
  useEffect(() => {
    const stopScene = startSceneSync(projectId);
    const stopCamera = startCameraSync(projectId);
    return () => {
      stopScene?.();
      stopCamera?.();
    };
  }, []);
  return (
    <main className="flex h-screen flex-row items-center justify-start">
      <GUI />
      <section className="relative h-full w-full bg-black">
        <EnterXRButtons />
        <ModeToggleButton />
        <Canvas />
      </section>
    </main>
  );
}

function EnterXRButtons() {
  return (
    <div className="absolute bottom-4 left-1/2 z-50 flex translate-x-[-50%] gap-4">
      <OverlayButton label="Enter VR" onClick={() => xrStore.enterVR()} />
      <OverlayButton label="Enter AR" onClick={() => xrStore.enterAR()} />
    </div>
  );
}

function ModeToggleButton() {
  const mode = useEditorStore((s) => s.mode);
  const toggleMode = useEditorStore((s) => s.toggleMode);

  return (
    <div className="absolute top-4 right-4 z-50">
      <OverlayButton
        label={mode === "edit" ? "Play" : "Edit"}
        onClick={toggleMode}
      />
    </div>
  );
}

function OverlayButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-9 items-center rounded-lg border border-neutral-200 bg-white px-4 py-6 text-xl font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:ring-2 focus:ring-blue-500/50 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus:ring-blue-400/50"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
