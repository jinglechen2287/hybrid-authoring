import { describe, it, expect } from 'vitest';
import { useEditorStore } from '~/stores/editorStore';

describe('editorStore', () => {
  describe('toggleMode', () => {
    it('switches from edit to play mode', () => {
      const store = useEditorStore.getState();
      expect(store.mode).toBe('edit');

      store.toggleMode();

      expect(useEditorStore.getState().mode).toBe('play');
    });

    it('switches from play to edit mode', () => {
      useEditorStore.setState({ mode: 'play' });

      useEditorStore.getState().toggleMode();

      expect(useEditorStore.getState().mode).toBe('edit');
    });

    it('resets objStateIdxMap to 0 for all objects when entering play mode', () => {
      useEditorStore.setState({
        mode: 'edit',
        objStateIdxMap: { obj1: 2, obj2: 3 },
      });

      useEditorStore.getState().toggleMode();

      const state = useEditorStore.getState();
      expect(state.mode).toBe('play');
      expect(state.objStateIdxMap).toEqual({ obj1: 0, obj2: 0 });
    });

    it('creates entry for selectedObjId if map is empty when entering play mode', () => {
      useEditorStore.setState({
        mode: 'edit',
        selectedObjId: 'selected-obj',
        objStateIdxMap: {},
      });

      useEditorStore.getState().toggleMode();

      const state = useEditorStore.getState();
      expect(state.mode).toBe('play');
      expect(state.objStateIdxMap).toEqual({ 'selected-obj': 0 });
    });
  });

  describe('setSelectedObjId', () => {
    it('sets selection and creates map entry if not exists', () => {
      useEditorStore.setState({ selectedObjId: undefined, objStateIdxMap: {} });

      useEditorStore.getState().setSelectedObjId('new-obj');

      const state = useEditorStore.getState();
      expect(state.selectedObjId).toBe('new-obj');
      expect(state.objStateIdxMap['new-obj']).toBe(0);
    });

    it('sets selection without modifying existing map entry', () => {
      useEditorStore.setState({
        selectedObjId: undefined,
        objStateIdxMap: { 'existing-obj': 5 },
      });

      useEditorStore.getState().setSelectedObjId('existing-obj');

      const state = useEditorStore.getState();
      expect(state.selectedObjId).toBe('existing-obj');
      expect(state.objStateIdxMap['existing-obj']).toBe(5);
    });

    it('clears selection when called with undefined', () => {
      useEditorStore.setState({ selectedObjId: 'some-obj' });

      useEditorStore.getState().setSelectedObjId(undefined);

      expect(useEditorStore.getState().selectedObjId).toBeUndefined();
    });
  });

  describe('setObjStateIdxMap', () => {
    it('updates only selected object in edit mode', () => {
      useEditorStore.setState({
        mode: 'edit',
        selectedObjId: 'obj1',
        objStateIdxMap: { obj1: 0, obj2: 0 },
      });

      useEditorStore.getState().setObjStateIdxMap(3);

      const state = useEditorStore.getState();
      expect(state.objStateIdxMap).toEqual({ obj1: 3, obj2: 0 });
    });

    it('does nothing in edit mode if no object is selected', () => {
      useEditorStore.setState({
        mode: 'edit',
        selectedObjId: undefined,
        objStateIdxMap: { obj1: 1 },
      });

      useEditorStore.getState().setObjStateIdxMap(5);

      expect(useEditorStore.getState().objStateIdxMap).toEqual({ obj1: 1 });
    });
  });

  describe('connecting state', () => {
    it('setConnectingFrom enters connecting mode', () => {
      useEditorStore.getState().setConnectingFrom('obj-id', 'state-id');

      const state = useEditorStore.getState();
      expect(state.isConnecting).toBe(true);
      expect(state.connectingFromObjId).toBe('obj-id');
      expect(state.connectingFromStateId).toBe('state-id');
      expect(state.connectingTrigger).toBe('click');
    });

    it('cycleConnectingTrigger cycles through triggers correctly', () => {
      useEditorStore.setState({ connectingTrigger: 'click', isConnecting: true });

      useEditorStore.getState().cycleConnectingTrigger();
      expect(useEditorStore.getState().connectingTrigger).toBe('hoverStart');

      useEditorStore.getState().cycleConnectingTrigger();
      expect(useEditorStore.getState().connectingTrigger).toBe('hoverEnd');

      useEditorStore.getState().cycleConnectingTrigger();
      expect(useEditorStore.getState().connectingTrigger).toBe('auto');

      useEditorStore.getState().cycleConnectingTrigger();
      const state = useEditorStore.getState();
      expect(state.connectingTrigger).toBe('');
      expect(state.isConnecting).toBe(false);
    });

    it('cancelConnecting resets all connecting-related state', () => {
      useEditorStore.setState({
        isConnecting: true,
        connectingFromObjId: 'obj-id',
        connectingFromStateId: 'state-id',
        connectingTrigger: 'hoverStart',
      });

      useEditorStore.getState().cancelConnecting();

      const state = useEditorStore.getState();
      expect(state.isConnecting).toBe(false);
      expect(state.connectingFromObjId).toBeUndefined();
      expect(state.connectingFromStateId).toBeUndefined();
      expect(state.connectingTrigger).toBe('click');
    });
  });
});
