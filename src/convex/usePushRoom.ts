import { useContext } from "react";
import { ProjectSyncContext } from "./projectSyncContextValue";

export function usePushRoom(): () => void {
  const context = useContext(ProjectSyncContext);
  if (!context) {
    throw new Error("usePushRoom must be used within ProjectSyncProvider");
  }
  return context.pushRoom;
}
