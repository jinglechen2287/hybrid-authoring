import EnterXRButtons from "~/components/overlays/EnterXRButtons";
import Canvas from "~/canvas/Canvas";
import { useEffect } from "react";
import { startSceneSupabaseSync } from "~/util";
import "./index.css";
import Tabs from "./components/sections/Tabs";
import { useSceneStore } from "~/stores";

const projectId = 1;

export default function App() {
  useEffect(() => {
    const stop = startSceneSupabaseSync(projectId);
    return () => {
      stop?.();
    };
  }, []);
  const selected = useSceneStore((state) => state.selected);
  return (
    <div className="flex h-screen flex-row items-center justify-start">
      <div className="h-full w-1/3 min-w-96 bg-neutral-900 p-4">
        {selected && <Tabs />}
        {!selected && <p className="text-white">Select an object</p>}
      </div>

      <div className="relative h-full w-full">
        <EnterXRButtons />
        <Canvas />
      </div>
    </div>
  );
}
