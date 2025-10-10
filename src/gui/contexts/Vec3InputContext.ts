import { createContext, useContext } from "react";
import type { Vec3InputType } from "~/types";

export const Vec3InputContext = createContext<{
  type: Vec3InputType;
}>({
  type: "position",
});

export const useVec3Input = () => {
  return useContext(Vec3InputContext);
};
