import { createContext } from "react";

export type ProjectSyncContextValue = {
  pushRoom: () => void;
};

export const ProjectSyncContext = createContext<ProjectSyncContextValue | null>(
  null
);
