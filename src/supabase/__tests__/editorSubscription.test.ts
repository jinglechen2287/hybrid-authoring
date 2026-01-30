import { describe, it, expect } from "vitest";
import { isValidEditorData } from "~/utils/validation";

describe("supabase/editorSubscription", () => {
  describe("isValidEditorData", () => {
    it("returns true for valid editor data with mode 'edit'", () => {
      const validEditor = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
        isHybrid: false,
      };
      expect(isValidEditorData(validEditor)).toBe(true);
    });

    it("returns true for valid editor data with mode 'play'", () => {
      const validEditor = {
        mode: "play",
        selectedObjId: undefined,
        objStateIdxMap: {},
        isHybrid: true,
      };
      expect(isValidEditorData(validEditor)).toBe(true);
    });

    it("returns true with extra properties (allows superset)", () => {
      const editorWithExtras = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
        isHybrid: false,
        extraField: "ignored",
      };
      expect(isValidEditorData(editorWithExtras)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidEditorData(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidEditorData(undefined)).toBe(false);
    });

    it("returns false for non-object types", () => {
      expect(isValidEditorData("string")).toBe(false);
      expect(isValidEditorData(123)).toBe(false);
      expect(isValidEditorData(true)).toBe(false);
      expect(isValidEditorData([])).toBe(false);
    });

    it("returns false for invalid mode value", () => {
      const invalidMode = {
        mode: "invalid",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
        isHybrid: false,
      };
      expect(isValidEditorData(invalidMode)).toBe(false);
    });

    it("returns false for missing mode", () => {
      const missing = {
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
        isHybrid: false,
      };
      expect(isValidEditorData(missing)).toBe(false);
    });

    it("returns false for missing objStateIdxMap", () => {
      const missing = {
        mode: "edit",
        selectedObjId: "obj1",
        isHybrid: false,
      };
      expect(isValidEditorData(missing)).toBe(false);
    });

    it("returns false for missing isHybrid", () => {
      const missing = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
      };
      expect(isValidEditorData(missing)).toBe(false);
    });

    it("returns false for null objStateIdxMap", () => {
      const invalid = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: null,
        isHybrid: false,
      };
      expect(isValidEditorData(invalid)).toBe(false);
    });

    it("returns false for non-object objStateIdxMap", () => {
      const invalid = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: "not-an-object",
        isHybrid: false,
      };
      expect(isValidEditorData(invalid)).toBe(false);
    });

    it("returns false for non-boolean isHybrid", () => {
      const invalid = {
        mode: "edit",
        selectedObjId: "obj1",
        objStateIdxMap: { obj1: 0 },
        isHybrid: "true",
      };
      expect(isValidEditorData(invalid)).toBe(false);
    });

    it("accepts undefined selectedObjId as valid", () => {
      const validWithUndefined = {
        mode: "edit",
        selectedObjId: undefined,
        objStateIdxMap: {},
        isHybrid: false,
      };
      expect(isValidEditorData(validWithUndefined)).toBe(true);
    });

    it("accepts empty objStateIdxMap as valid", () => {
      const validWithEmpty = {
        mode: "play",
        selectedObjId: "obj1",
        objStateIdxMap: {},
        isHybrid: true,
      };
      expect(isValidEditorData(validWithEmpty)).toBe(true);
    });

    it("accepts complex objStateIdxMap with multiple entries", () => {
      const validComplex = {
        mode: "edit",
        selectedObjId: "obj2",
        objStateIdxMap: { obj1: 0, obj2: 1, obj3: 2 },
        isHybrid: false,
      };
      expect(isValidEditorData(validComplex)).toBe(true);
    });
  });
});
