import { describe, it, expect, beforeEach } from "vitest";
import { stringify, pickDBFields, clientId } from "../util";
import { useEditorStore, useSceneStore } from "~/stores";

describe("supabase/util", () => {
  describe("clientId", () => {
    it("is a valid UUID v4 format", () => {
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // where y is one of 8, 9, a, or b
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(clientId).toMatch(uuidV4Regex);
    });

    it("is a string of expected length (36 characters)", () => {
      // UUID format: 8-4-4-4-12 = 32 hex chars + 4 hyphens = 36 chars
      expect(clientId).toHaveLength(36);
    });
  });

  describe("stringify", () => {
    it("serializes objects to JSON", () => {
      const obj = { name: "test", value: 42 };
      expect(stringify(obj)).toBe('{"name":"test","value":42}');
    });

    it("serializes arrays to JSON", () => {
      const arr = [1, 2, 3];
      expect(stringify(arr)).toBe("[1,2,3]");
    });

    it("serializes primitives to JSON", () => {
      expect(stringify("hello")).toBe('"hello"');
      expect(stringify(123)).toBe("123");
      expect(stringify(true)).toBe("true");
      expect(stringify(null)).toBe("null");
    });

    it("returns empty string for circular references", () => {
      const circular: Record<string, unknown> = { name: "test" };
      circular.self = circular;
      expect(stringify(circular)).toBe("");
    });

    it("returns empty string for BigInt (not serializable)", () => {
      expect(stringify(BigInt(123))).toBe("");
    });
  });

  describe("pickDBFields", () => {
    beforeEach(() => {
      // Reset stores to known state
      useSceneStore.setState({
        lightPosition: [1, 2, 3],
        content: { obj1: { type: "sphere", name: "Object 1", states: [] } },
      });
      useEditorStore.setState({
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 2 },
        isHybrid: false,
      });
    });

    it("extracts correct fields from stores", () => {
      const fields = pickDBFields();

      expect(fields).toEqual({
        lightPosition: [1, 2, 3],
        content: { obj1: { type: "sphere", name: "Object 1", states: [] } },
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 2 },
        isHybrid: false,
      });
    });

    it("reflects current store state", () => {
      // Update store
      useEditorStore.setState({ mode: "play", selectedObjId: "obj2" });

      const fields = pickDBFields();

      expect(fields.mode).toBe("play");
      expect(fields.selectedObjId).toBe("obj2");
    });

    it("includes all required DB fields", () => {
      const fields = pickDBFields();
      const requiredKeys = [
        "lightPosition",
        "content",
        "mode",
        "selectedObjId",
        "objStateIdxMap",
        "isHybrid",
      ];

      for (const key of requiredKeys) {
        expect(fields).toHaveProperty(key);
      }
    });
  });
});
