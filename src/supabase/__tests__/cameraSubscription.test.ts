import { describe, it, expect } from "vitest";
import { isValidCameraData } from "~/utils/validation";

describe("supabase/cameraSubscription", () => {
  describe("isValidCameraData", () => {
    it("returns true for valid camera data", () => {
      const validCamera = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(validCamera)).toBe(true);
    });

    it("returns true with extra properties (allows superset)", () => {
      const cameraWithExtras = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1, 0],
        extraField: "ignored",
      };
      expect(isValidCameraData(cameraWithExtras)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidCameraData(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidCameraData(undefined)).toBe(false);
    });

    it("returns false for non-object types", () => {
      expect(isValidCameraData("string")).toBe(false);
      expect(isValidCameraData(123)).toBe(false);
      expect(isValidCameraData(true)).toBe(false);
      expect(isValidCameraData([])).toBe(false);
    });

    it("returns false for missing distance", () => {
      const missing = {
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(missing)).toBe(false);
    });

    it("returns false for missing yaw", () => {
      const missing = {
        distance: 5,
        pitch: -0.3,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(missing)).toBe(false);
    });

    it("returns false for missing pitch", () => {
      const missing = {
        distance: 5,
        yaw: 0.5,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(missing)).toBe(false);
    });

    it("returns false for missing origin", () => {
      const missing = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
      };
      expect(isValidCameraData(missing)).toBe(false);
    });

    it("returns false for invalid origin (not an array)", () => {
      const invalid = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: "not-an-array",
      };
      expect(isValidCameraData(invalid)).toBe(false);
    });

    it("returns false for invalid origin (wrong length)", () => {
      const tooShort = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1],
      };
      expect(isValidCameraData(tooShort)).toBe(false);

      const tooLong = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1, 0, 1],
      };
      expect(isValidCameraData(tooLong)).toBe(false);
    });

    it("returns false for invalid origin (non-number elements)", () => {
      const invalid = {
        distance: 5,
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, "string", 0],
      };
      expect(isValidCameraData(invalid)).toBe(false);
    });

    it("returns false for non-number distance", () => {
      const invalid = {
        distance: "5",
        yaw: 0.5,
        pitch: -0.3,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(invalid)).toBe(false);
    });

    it("returns false for non-number yaw", () => {
      const invalid = {
        distance: 5,
        yaw: null,
        pitch: -0.3,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(invalid)).toBe(false);
    });

    it("returns false for non-number pitch", () => {
      const invalid = {
        distance: 5,
        yaw: 0.5,
        pitch: undefined,
        origin: [0, 1, 0],
      };
      expect(isValidCameraData(invalid)).toBe(false);
    });

    it("accepts zero values as valid numbers", () => {
      const zeroValues = {
        distance: 0,
        yaw: 0,
        pitch: 0,
        origin: [0, 0, 0],
      };
      expect(isValidCameraData(zeroValues)).toBe(true);
    });

    it("accepts negative values as valid numbers", () => {
      const negativeValues = {
        distance: -5,
        yaw: -0.5,
        pitch: -0.3,
        origin: [-1, -2, -3],
      };
      expect(isValidCameraData(negativeValues)).toBe(true);
    });
  });
});
