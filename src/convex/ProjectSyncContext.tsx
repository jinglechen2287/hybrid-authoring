import type { ReactNode } from "react";
import { useProjectSync } from "./hooks";
import { ProjectSyncContext } from "./projectSyncContextValue";

export function ProjectSyncProvider({ children }: { children: ReactNode }) {
  const { pushRoom } = useProjectSync();

  return (
    <ProjectSyncContext.Provider value={{ pushRoom }}>
      {children}
    </ProjectSyncContext.Provider>
  );
}
