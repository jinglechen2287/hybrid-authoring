import Vec3Input from "../layouts/Vec3Input";
import Vec3InputContextProvider from "~/gui/contexts/Vec3InputContextProvider";

export default function Transform() {
  return (
    <div className="flex flex-col gap-6">
      <Vec3InputContextProvider type="position">
        <Vec3Input />
      </Vec3InputContextProvider>
      <Vec3InputContextProvider type="rotation">
        <Vec3Input />
      </Vec3InputContextProvider>
      <Vec3InputContextProvider type="scale">
        <Vec3Input />
      </Vec3InputContextProvider>
    </div>
  );
}
