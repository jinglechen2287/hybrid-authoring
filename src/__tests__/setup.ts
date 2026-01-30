import { beforeEach, vi } from 'vitest';

// Mock @react-three/xr before any imports that use it
// The XR emulator requires WebGL context which happy-dom doesn't provide
vi.mock('@react-three/xr', () => ({
  createXRStore: () => ({
    getState: () => ({ session: null }),
    subscribe: () => () => {},
    setState: () => {},
  }),
}));

import { useEditorStore } from '~/stores/editorStore';
import { useSceneStore } from '~/stores/sceneStore';
import { useRoomStore } from '~/stores/roomStore';

// Reset Zustand stores before each test
beforeEach(() => {
  // Reset editorStore to initial state
  useEditorStore.setState({
    mode: 'edit',
    selectedObjId: undefined,
    objStateIdxMap: {},
    isHybrid: false,
    isConnecting: false,
    connectingTrigger: 'click',
    connectingFromObjId: undefined,
    connectingFromStateId: undefined,
  });

  // Reset sceneStore to initial state
  useSceneStore.setState({
    lightPosition: [0.3, 0.3, 0.3],
    content: {},
  });

  // Reset roomStore to initial state
  useRoomStore.setState({
    planes: [],
  });
});
