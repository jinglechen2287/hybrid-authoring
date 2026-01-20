# Implementation Plan: Tests and Code Cleanup for hybrid-authoring

## Overview
Add test coverage to the codebase, then refactor using best programming practices. Tests are written first to ensure cleanup doesn't break functionality.

---

## Phase 1: Testing Infrastructure Setup

### 1.1 Install Dependencies
```bash
npm install -D vitest @testing-library/react happy-dom
```
Note: Remove `uuid` package later (will use native `crypto.randomUUID()`)

### 1.2 Create Vitest Config
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.app.json'] })],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

### 1.3 Create Test Setup
Create `src/__tests__/setup.ts` to reset Zustand stores before each test.

### 1.4 Add Test Scripts to package.json
```json
"test": "vitest",
"test:run": "vitest run"
```

---

## Phase 2: Write Unit Tests

### 2.1 Test editorStore.ts (CRITICAL)
File: `src/stores/__tests__/editorStore.test.ts`

Test cases:
- `toggleMode()` switches between 'edit' and 'play'
- `toggleMode()` resets `objStateIdxMap` to 0 for all objects when entering play mode
- `toggleMode()` creates entry for `selectedObjId` if map is empty
- `setSelectedObjId(value)` sets selection and creates map entry
- `setSelectedObjId(undefined)` clears selection
- `setObjStateIdxMap(value)` in edit mode updates only selected object
- `setObjStateIdxMap(value)` in play mode updates all objects uniformly
- `setConnectingFrom()` enters connecting mode
- `cycleConnectingTrigger()` cycles: click → hoverStart → hoverEnd → auto → '' (exit)
- `cancelConnecting()` resets all connecting-related state

### 2.2 Test supabase/util.ts
File: `src/supabase/__tests__/util.test.ts`

Test cases:
- `stringify()` serializes objects to JSON
- `stringify()` returns empty string for circular references
- `pickDBFields()` extracts correct fields from stores
- `clientId` is a valid UUID

### 2.3 Test State Operations (after extraction)
File: `src/utils/__tests__/stateOperations.test.ts`

Test cases:
- `addObjState()` clones current state's transform
- `addObjState()` inserts at correct index
- `addObjState()` generates unique ID using crypto.randomUUID()
- `removeObjState()` removes state at index
- `removeObjState()` prevents removal if only one state
- `removeObjState()` adjusts index if needed

### 2.4 Test cameraSubscription - isValidCameraData
File: `src/supabase/__tests__/cameraSubscription.test.ts`

Test cases:
- Returns true for valid camera data
- Returns false for null/undefined
- Returns false for missing fields
- Returns false for invalid origin array

---

## Phase 3: Code Cleanup

### 3.1 Replace uuid with crypto.randomUUID()

**Files to update:**
- `src/supabase/util.ts` (line 1, 4): Remove import, use `crypto.randomUUID()`
- `src/canvas/interaction/StateHandles.tsx` (line 6, 52): Remove import, use `crypto.randomUUID()`
- `src/gui/components/sections/StatesSection.tsx` (line 4, 32): Remove import, use `crypto.randomUUID()`

**Then remove uuid from package.json:**
```bash
npm uninstall uuid @types/uuid
```

### 3.2 Extract Constants
Create `src/constants.ts` with:
- `SCALES` - all hardcoded scale values (0.032, 0.036, 0.038, 0.042, etc.)
- `FONT_SIZES` - text sizes (0.025, 0.5, 0.2, etc.)
- `EMISSIVE` - hover intensity values (0, 0.3)
- `ANIMATION` - timing constants (debounce 10ms, maxWait 50ms, lerp 1000ms)
- `TRIGGER_COLORS` - color mapping for trigger types
- `TRIGGER_ORDER` - ['click', 'hoverStart', 'hoverEnd', 'auto', '']
- `CAMERA_CONFIG` - extracted from Canvas.tsx inline object

Files to update:
- `src/canvas/interaction/StateHandles.tsx`
- `src/canvas/interaction/CameraHelper.tsx`
- `src/canvas/interaction/ModeToggleHandle.tsx`
- `src/canvas/scene/SceneContent.tsx`
- `src/canvas/scene/Scene.tsx`
- `src/canvas/Canvas.tsx`
- `src/stores/editorStore.ts`

### 3.3 Extract Shared State Operations
Create `src/utils/stateOperations.ts`:
- `addObjState(selectedObjId, currentStateIdx)` - add new state using `crypto.randomUUID()`
- `removeObjState(selectedObjId, currentStateIdx)` - remove state

Files to update:
- `src/canvas/interaction/StateHandles.tsx` (lines 43-74, 76-99)
- `src/gui/components/sections/StatesSection.tsx` (duplicated logic)

### 3.4 Extract State Index Helper
Create `src/utils/stateHelpers.ts`:
```typescript
export function getObjStateIdx(
  objStateIdxMap: Record<string, number>,
  selectedObjId: string | undefined
): number {
  if (!selectedObjId) return 0;
  return objStateIdxMap[selectedObjId] ?? 0;
}

export function getStateLabel(index: number): string {
  return index === 0 ? 'Base State' : `State ${index}`;
}
```

### 3.5 Extract Audio Utility
Create `src/utils/audio.ts`:
```typescript
let confirmAudio: HTMLAudioElement | null = null;

export function playConfirmSound(): void {
  try {
    if (!confirmAudio) {
      confirmAudio = new Audio('/confirm.wav');
    }
    confirmAudio.currentTime = 0;
    void confirmAudio.play();
  } catch {
    console.error('Failed to play confirm audio');
  }
}
```

### 3.6 Fix Typo
File: `src/canvas/interaction/Hover.tsx`
Change `hoverd` → `hovered` on line 17.

### 3.7 Fix Type Safety Issues
- `src/canvas/AnchoredScene.tsx` line 29: Replace `any` with proper XR types
- Export `isValidCameraData` from `src/supabase/cameraSubscription.ts` for testing

---

## Phase 4: Performance Optimizations

### 4.1 Add React.memo to Components
Wrap these components with `React.memo()`:
- `src/App.tsx` - `OverlayButton` component
- `src/gui/components/sections/Sections.tsx`
- `src/gui/components/sections/SelectionSection.tsx`
- `src/gui/components/sections/TransformSection.tsx`
- `src/gui/components/sections/StatesSection.tsx`
- `src/gui/components/ui/TextInput.tsx`
- `src/gui/components/layouts/Vec3Input.tsx`
- `src/gui/components/layouts/Section.tsx`
- `src/canvas/scene/MiniatureRoom.tsx` - `StoredPlane` component

### 4.2 Add useMemo/useCallback
**Select.tsx (lines 21-28):**
```typescript
const normalized = useMemo(() => items.map(...), [items]);
const valueToLabel = useMemo(() => new Map(...), [normalized]);
```

**NumberInput.tsx (lines 28-41):**
- Wrap `valueChangeHandler` with `useCallback`

**SceneContent.tsx:**
- Move `getTransitionColor` outside component OR use constant from `constants.ts`
- Add `useMemo` for state ID Map to optimize O(n) lookups:
```typescript
const stateIdMap = useMemo(() =>
  new Map(objStates.map((s, i) => [s.id, i])),
  [objStates]
);
```

**CustomTransformHandles.tsx (lines 102-107):**
- Extract `lerp` and `lerpVec3` functions outside component (module-level)

### 4.3 Fix useEffect Dependencies
**CustomTransformHandles.tsx (lines 44-71):**
- Remove `mode` from dependency array (subscriptions handle state changes internally)

### 4.4 Fix Index-based Keys
Replace index keys with stable IDs:
- `src/gui/components/sections/StatesSection.tsx` line 99: Use `state.id` instead of `i`
- `src/canvas/scene/MiniatureRoom.tsx` line 49: Use `data.id ?? i`

### 4.5 Extract Inline Objects
**Canvas.tsx (lines 23-27):**
```typescript
// Before (inline objects recreated every render)
camera={{ position: [0, 1, -0.5] }}
style={{ width: "100%", flexGrow: 1 }}

// After (use constants)
import { CAMERA_CONFIG, CANVAS_STYLE } from '~/constants';
camera={CAMERA_CONFIG}
style={CANVAS_STYLE}
```

---

## Phase 5: Verification

### 5.1 Run Tests
```bash
npm run test:run
```
All tests should pass.

### 5.2 Run Build
```bash
npm run build
```
No TypeScript errors.

### 5.3 Manual Smoke Test
```bash
npm run dev
```
Verify:
- Object selection works
- State add/remove works
- Mode toggle (edit/play) works
- Transform handles work
- Real-time sync works (open two tabs)

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `src/stores/editorStore.ts` | Add tests |
| `src/supabase/util.ts` | Add tests, replace uuid with crypto |
| `src/supabase/cameraSubscription.ts` | Export isValidCameraData, add tests |
| `src/canvas/interaction/StateHandles.tsx` | Replace uuid, extract state ops, audio, use constants, useCallback |
| `src/gui/components/sections/StatesSection.tsx` | Replace uuid, use extracted state ops, fix keys, React.memo |
| `src/gui/components/ui/Select.tsx` | Add useMemo |
| `src/gui/components/ui/NumberInput.tsx` | Add useCallback |
| `src/canvas/scene/SceneContent.tsx` | Use constants, useMemo for stateIdMap |
| `src/canvas/interaction/CustomTransformHandles.tsx` | Extract lerp functions, fix useEffect deps |
| `src/canvas/interaction/Hover.tsx` | Fix typo |
| `src/canvas/Canvas.tsx` | Use constants for inline objects |
| `src/constants.ts` | NEW - centralized constants |
| `src/utils/stateOperations.ts` | NEW - shared state logic |
| `src/utils/stateHelpers.ts` | NEW - state index helper |
| `src/utils/audio.ts` | NEW - audio utility |

---

## Implementation Order

1. **Setup** - Install deps, create vitest config, setup file, scripts
2. **Test editorStore** - Most critical business logic
3. **Test util.ts** - Pure functions, easy to test
4. **Replace uuid with crypto** - Remove dependency (3 files)
5. **Extract constants.ts** - Foundation for cleanup
6. **Extract stateOperations.ts** - Remove duplication
7. **Test stateOperations** - Verify extracted logic
8. **Extract stateHelpers.ts** - Remove repeated pattern
9. **Extract audio.ts** - Remove duplication
10. **Fix typo** - Quick fix
11. **Fix types** - Improve type safety
12. **Test cameraSubscription** - Type validation tests
13. **Add React.memo** - Wrap components
14. **Add useMemo/useCallback** - Optimize handlers
15. **Fix useEffect deps** - Remove unnecessary deps
16. **Fix index keys** - Use stable IDs
17. **Extract inline objects** - Use constants
18. **Final verification** - Run all tests, build, manual smoke test
