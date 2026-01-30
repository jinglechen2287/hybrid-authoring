import { describe, it, expect } from "vitest";
import { isValidSceneData } from "~/utils/validation";

describe("supabase/sceneSubscription", () => {
  describe("isValidSceneData", () => {
    it("returns true for valid scene data", () => {
      const validScene = {
        lightPosition: [1, 2, 3],
        content: {
          obj1: { type: "sphere", name: "Object 1", states: [] },
        },
      };
      expect(isValidSceneData(validScene)).toBe(true);
    });

    it("returns true with empty content object", () => {
      const validScene = {
        lightPosition: [0, 0, 0],
        content: {},
      };
      expect(isValidSceneData(validScene)).toBe(true);
    });

    it("returns true with extra properties (allows superset)", () => {
      const sceneWithExtras = {
        lightPosition: [1, 2, 3],
        content: {},
        extraField: "ignored",
      };
      expect(isValidSceneData(sceneWithExtras)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidSceneData(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidSceneData(undefined)).toBe(false);
    });

    it("returns false for non-object types", () => {
      expect(isValidSceneData("string")).toBe(false);
      expect(isValidSceneData(123)).toBe(false);
      expect(isValidSceneData(true)).toBe(false);
      expect(isValidSceneData([])).toBe(false);
    });

    it("returns false for missing lightPosition", () => {
      const missing = {
        content: {},
      };
      expect(isValidSceneData(missing)).toBe(false);
    });

    it("returns false for missing content", () => {
      const missing = {
        lightPosition: [1, 2, 3],
      };
      expect(isValidSceneData(missing)).toBe(false);
    });

    it("returns false for invalid lightPosition (not an array)", () => {
      const invalid = {
        lightPosition: "not-an-array",
        content: {},
      };
      expect(isValidSceneData(invalid)).toBe(false);
    });

    it("returns false for invalid lightPosition (wrong length - too short)", () => {
      const tooShort = {
        lightPosition: [1, 2],
        content: {},
      };
      expect(isValidSceneData(tooShort)).toBe(false);
    });

    it("returns false for invalid lightPosition (wrong length - too long)", () => {
      const tooLong = {
        lightPosition: [1, 2, 3, 4],
        content: {},
      };
      expect(isValidSceneData(tooLong)).toBe(false);
    });

    it("returns false for invalid lightPosition (non-number elements)", () => {
      const invalid = {
        lightPosition: [1, "string", 3],
        content: {},
      };
      expect(isValidSceneData(invalid)).toBe(false);
    });

    it("returns false for null content", () => {
      const invalid = {
        lightPosition: [1, 2, 3],
        content: null,
      };
      expect(isValidSceneData(invalid)).toBe(false);
    });

    it("returns false for non-object content", () => {
      const invalid = {
        lightPosition: [1, 2, 3],
        content: "not-an-object",
      };
      expect(isValidSceneData(invalid)).toBe(false);
    });

    it("accepts zero values in lightPosition as valid numbers", () => {
      const zeroValues = {
        lightPosition: [0, 0, 0],
        content: {},
      };
      expect(isValidSceneData(zeroValues)).toBe(true);
    });

    it("accepts negative values in lightPosition as valid numbers", () => {
      const negativeValues = {
        lightPosition: [-1, -2, -3],
        content: {},
      };
      expect(isValidSceneData(negativeValues)).toBe(true);
    });

    it("accepts complex content with multiple objects", () => {
      const complexContent = {
        lightPosition: [5, 10, 5],
        content: {
          obj1: {
            type: "sphere",
            name: "Sphere 1",
            states: [
              {
                id: "state1",
                transform: {
                  position: [0, 0, 0],
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                },
                trigger: "click",
                transitionTo: "state2",
              },
            ],
          },
          obj2: {
            type: "cube",
            name: "Cube 1",
            states: [],
          },
          obj3: {
            type: "cone",
            name: "Cone 1",
            states: [],
          },
        },
      };
      expect(isValidSceneData(complexContent)).toBe(true);
    });

    it("returns false for array content (must be object)", () => {
      const invalid = {
        lightPosition: [1, 2, 3],
        content: [],
      };
      expect(isValidSceneData(invalid)).toBe(false);
    });
  });
});
