import type { Vec3InputType } from "~/types";
import { Vec3InputContext } from "./Vec3InputContext";

export default function Vec3InputContextProvider({
  children,
  type,
}: {
  children: React.ReactNode;
  type: Vec3InputType;
}) {
  return (
    <Vec3InputContext.Provider value={{ type }}>
      {children}
    </Vec3InputContext.Provider>
  );
}
