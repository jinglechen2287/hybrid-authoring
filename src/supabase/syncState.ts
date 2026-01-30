// Shared state for coordinating sync between scene, editor, and camera subscriptions
// Prevents feedback loops when applying remote updates to stores

let isApplyingRemoteUpdate = false;

export function getIsApplyingRemoteUpdate() {
  return isApplyingRemoteUpdate;
}

export function setIsApplyingRemoteUpdate(value: boolean) {
  isApplyingRemoteUpdate = value;
}

/**
 * Wrap a function that applies remote updates.
 * Sets the flag before execution and clears it after yielding to the event loop.
 */
export function withRemoteUpdateFlag(fn: () => void) {
  setIsApplyingRemoteUpdate(true);
  try {
    fn();
  } finally {
    // Yield back to event loop so subscribers see the updated state before we flip the flag
    setTimeout(() => {
      setIsApplyingRemoteUpdate(false);
    }, 0);
  }
}
