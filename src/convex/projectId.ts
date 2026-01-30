import type { Id } from "../../convex/_generated/dataModel";

// Hardcoded project ID for the single-project setup
// This ID should be created via Convex dashboard or seed script
const projectIdEnv = import.meta.env.VITE_CONVEX_PROJECT_ID;
if (!projectIdEnv) {
  throw new Error("VITE_CONVEX_PROJECT_ID environment variable is required");
}
export const PROJECT_ID = projectIdEnv as Id<"projects">;
