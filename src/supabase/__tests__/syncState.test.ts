import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getIsApplyingRemoteUpdate,
  setIsApplyingRemoteUpdate,
  withRemoteUpdateFlag,
} from "../syncState";

describe("supabase/syncState", () => {
  beforeEach(() => {
    // Reset state to false before each test
    setIsApplyingRemoteUpdate(false);
  });

  describe("getIsApplyingRemoteUpdate", () => {
    it("returns false by default", () => {
      expect(getIsApplyingRemoteUpdate()).toBe(false);
    });

    it("returns true when flag is set to true", () => {
      setIsApplyingRemoteUpdate(true);
      expect(getIsApplyingRemoteUpdate()).toBe(true);
    });
  });

  describe("setIsApplyingRemoteUpdate", () => {
    it("sets the flag to true", () => {
      setIsApplyingRemoteUpdate(true);
      expect(getIsApplyingRemoteUpdate()).toBe(true);
    });

    it("sets the flag to false", () => {
      setIsApplyingRemoteUpdate(true);
      setIsApplyingRemoteUpdate(false);
      expect(getIsApplyingRemoteUpdate()).toBe(false);
    });

    it("can toggle the flag multiple times", () => {
      setIsApplyingRemoteUpdate(true);
      expect(getIsApplyingRemoteUpdate()).toBe(true);

      setIsApplyingRemoteUpdate(false);
      expect(getIsApplyingRemoteUpdate()).toBe(false);

      setIsApplyingRemoteUpdate(true);
      expect(getIsApplyingRemoteUpdate()).toBe(true);
    });
  });

  describe("withRemoteUpdateFlag", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("sets flag to true before executing the callback", () => {
      let flagDuringExecution = false;

      withRemoteUpdateFlag(() => {
        flagDuringExecution = getIsApplyingRemoteUpdate();
      });

      expect(flagDuringExecution).toBe(true);
    });

    it("executes the provided callback", () => {
      const callback = vi.fn();

      withRemoteUpdateFlag(callback);

      expect(callback).toHaveBeenCalledOnce();
    });

    it("keeps flag true immediately after execution (before setTimeout fires)", () => {
      withRemoteUpdateFlag(() => {});

      // Flag should still be true immediately after (setTimeout hasn't fired)
      expect(getIsApplyingRemoteUpdate()).toBe(true);
    });

    it("sets flag to false after yielding to event loop", () => {
      withRemoteUpdateFlag(() => {});

      // Advance timers to trigger setTimeout callback
      vi.runAllTimers();

      expect(getIsApplyingRemoteUpdate()).toBe(false);
    });

    it("clears flag even if callback throws an error", () => {
      const errorCallback = () => {
        throw new Error("Test error");
      };

      expect(() => withRemoteUpdateFlag(errorCallback)).toThrow("Test error");

      // Flag should still be true immediately (setTimeout hasn't fired yet)
      expect(getIsApplyingRemoteUpdate()).toBe(true);

      // After timer fires, flag should be false
      vi.runAllTimers();
      expect(getIsApplyingRemoteUpdate()).toBe(false);
    });

    it("allows subscribers to see updated state before flag is cleared", () => {
      const stateChanges: boolean[] = [];

      withRemoteUpdateFlag(() => {
        // Simulate a state change that a subscriber would react to
        stateChanges.push(getIsApplyingRemoteUpdate());
      });

      // Immediately after, flag is still true
      stateChanges.push(getIsApplyingRemoteUpdate());

      // After yielding, flag is false
      vi.runAllTimers();
      stateChanges.push(getIsApplyingRemoteUpdate());

      expect(stateChanges).toEqual([true, true, false]);
    });

    it("handles nested calls correctly", () => {
      const executionOrder: string[] = [];

      withRemoteUpdateFlag(() => {
        executionOrder.push("outer-start");
        executionOrder.push(`flag: ${getIsApplyingRemoteUpdate()}`);

        withRemoteUpdateFlag(() => {
          executionOrder.push("inner");
          executionOrder.push(`flag: ${getIsApplyingRemoteUpdate()}`);
        });

        executionOrder.push("outer-end");
      });

      expect(executionOrder).toEqual([
        "outer-start",
        "flag: true",
        "inner",
        "flag: true",
        "outer-end",
      ]);

      // After all timers fire, flag should be false
      vi.runAllTimers();
      expect(getIsApplyingRemoteUpdate()).toBe(false);
    });

    it("uses setTimeout with 0ms delay", () => {
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

      withRemoteUpdateFlag(() => {});

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);

      setTimeoutSpy.mockRestore();
    });
  });
});
