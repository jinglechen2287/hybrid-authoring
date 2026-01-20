import { createXRStore } from "@react-three/xr";

export const xrStore = createXRStore({ emulate: { syntheticEnvironment: false } });