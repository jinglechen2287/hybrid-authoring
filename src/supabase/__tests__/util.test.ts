import { describe, it, expect, beforeEach } from "vitest";
import {
  stringify,
  pickSceneFields,
  pickEditorFields,
  pickCameraFields,
  clientId,
} from "../util";
import { useEditorStore, useSceneStore, cameraStore } from "~/stores";

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

  describe("pickSceneFields", () => {
    beforeEach(() => {
      useSceneStore.setState({
        lightPosition: [1, 2, 3],
        content: { obj1: { type: "sphere", name: "Object 1", states: [] } },
      });
    });

    it("extracts correct fields from scene store", () => {
      const fields = pickSceneFields();

      expect(fields).toEqual({
        lightPosition: [1, 2, 3],
        content: { obj1: { type: "sphere", name: "Object 1", states: [] } },
      });
    });

    it("reflects current scene store state", () => {
      useSceneStore.setState({ lightPosition: [4, 5, 6] });

      const fields = pickSceneFields();

      expect(fields.lightPosition).toEqual([4, 5, 6]);
    });

    it("includes all required scene fields", () => {
      const fields = pickSceneFields();
      const requiredKeys = ["lightPosition", "content"];

      for (const key of requiredKeys) {
        expect(fields).toHaveProperty(key);
      }
    });
  });

  describe("pickEditorFields", () => {
    beforeEach(() => {
      useEditorStore.setState({
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 2 },
        isHybrid: false,
      });
    });

    it("extracts correct fields from editor store", () => {
      const fields = pickEditorFields();

      expect(fields).toEqual({
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 2 },
        isHybrid: false,
      });
    });

    it("reflects current editor store state", () => {
      useEditorStore.setState({ mode: "play", selectedObjId: "obj2" });

      const fields = pickEditorFields();

      expect(fields.mode).toBe("play");
      expect(fields.selectedObjId).toBe("obj2");
    });

    it("includes all required editor fields", () => {
      const fields = pickEditorFields();
      const requiredKeys = ["mode", "selectedObjId", "objStateIdxMap", "isHybrid"];

      for (const key of requiredKeys) {
        expect(fields).toHaveProperty(key);
      }
    });
  });

  describe("pickCameraFields", () => {
    beforeEach(() => {
      cameraStore.setState({
        distance: 5,
        yaw: Math.PI / 2,
        pitch: -Math.PI / 4,
        origin: [1, 2, 3],
      });
    });

    it("extracts correct fields from camera store", () => {
      const fields = pickCameraFields();

      expect(fields).toEqual({
        distance: 5,
        yaw: Math.PI / 2,
        pitch: -Math.PI / 4,
        origin: [1, 2, 3],
      });
    });

    it("reflects current camera store state", () => {
      cameraStore.setState({ distance: 10, yaw: Math.PI });

      const fields = pickCameraFields();

      expect(fields.distance).toBe(10);
      expect(fields.yaw).toBe(Math.PI);
    });

    it("includes all required camera fields", () => {
      const fields = pickCameraFields();
      const requiredKeys = ["distance", "yaw", "pitch", "origin"];

      for (const key of requiredKeys) {
        expect(fields).toHaveProperty(key);
      }
    });
  });
});
