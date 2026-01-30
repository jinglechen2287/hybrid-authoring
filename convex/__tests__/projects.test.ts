import { describe, it, expect } from "vitest";

// Note: convex-test requires Node.js filesystem APIs that are not available
// in happy-dom environment. The Convex queries/mutations are simple enough
// that they can be validated through integration testing.
//
// These tests verify the TypeScript types and basic structure.

describe("projects schema", () => {
  it("schema validators are defined", async () => {
    const schema = await import("../schema");
    expect(schema.default).toBeDefined();
    expect(schema.default.tables).toBeDefined();
    expect(schema.default.tables.projects).toBeDefined();
  });

  it("queries and mutations are exported", async () => {
    const projects = await import("../projects");
    // Queries
    expect(projects.getScene).toBeDefined();
    expect(projects.getEditor).toBeDefined();
    expect(projects.getCamera).toBeDefined();
    expect(projects.getRoom).toBeDefined();
    // Mutations
    expect(projects.updateScene).toBeDefined();
    expect(projects.updateEditor).toBeDefined();
    expect(projects.updateCamera).toBeDefined();
    expect(projects.updateRoom).toBeDefined();
  });
});
