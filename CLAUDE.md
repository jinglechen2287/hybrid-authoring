# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 3D scene editor with WebXR support for creating and manipulating objects with state machines. Objects can have multiple states with configurable transitions (click, hover, auto-sequencing). Supports both desktop editing and AR/VR immersive experiences with real-world plane detection.

## Commands

```bash
npm run dev       # Start Vite dev server (HTTPS via basic-ssl for XR)
npm run build     # TypeScript compile + Vite production build
npm run lint      # ESLint
npm run test      # Vitest in watch mode
npm run test:run  # Vitest single run
```

## Tech Stack

- **Build**: Vite 7, TypeScript 5 (strict)
- **UI**: React 19 with React Compiler, Tailwind CSS 4
- **3D**: Three.js 0.180, React Three Fiber, @react-three/drei, @react-three/handle, @react-three/xr
- **State**: Zustand 5 with Immer for immutable updates
- **Backend**: Convex with realtime queries

## Architecture

### State Management (src/stores/)

Three core Zustand stores:

- **sceneStore**: 3D scene content (`lightPosition`, `content: { [objId]: SceneObj }`)
- **editorStore**: UI state (`mode`, `selectedObjId`, `objStateIdxMap`, connection mode)
- **cameraStore**: Orbit camera state (from @react-three/fiber)

Additional stores: `xrStore` (WebXR session), `roomStore` (AR plane data)

### Key Data Types (src/types/)

```typescript
SceneObj = { type: "sphere"|"cube"|"cone", name: string, states: ObjState[] }
ObjState = { id: string, transform: Transform, trigger: TriggerType, transitionTo: string }
Transform = { position: Vector3Tuple, rotation: Vector3Tuple, scale: Vector3Tuple }
TriggerType = "click" | "hoverStart" | "hoverEnd" | "auto" | ""
```

### 3D Rendering (src/canvas/)

- **Canvas.tsx**: R3F setup with XR, custom pointer events, orbit controls
- **scene/SceneContent.tsx**: Objects rendering with transforms and state visualization
- **interaction/CustomTransformHandles.tsx**: Central hub for edit/play mode logic, transform handles, state transitions with lerp interpolation

### Convex Sync (src/convex/)

Pattern in `useProjectSync` hook:

1. `useQuery` hooks auto-subscribe to realtime updates from Convex
2. Remote data applied to Zustand stores via `useEffect`
3. Store subscriptions debounce local changes back via `useMutation`
4. Loop prevention via `applyingRemoteCount` ref counter

### GUI (src/gui/)

Left sidebar with sections: SelectionSection, StatesSection, TransformSection, BehaviorSection. Uses Vec3InputContext for coordinated XYZ inputs.

## Conventions

- **Path alias**: `~/*` resolves to `src/*`
- **Immutable updates**: Use Immer `produce()` with Zustand
- **Descriptive names**: `selectedObjId` not `selId`, `objStateIdxMap` not `map`
- **Component focus**: Scene components handle rendering/interaction, not business logic
- **Small composable hooks**: `Hover`, custom handles pattern

## Environment Setup

Create `.env.local`:

```text
CONVEX_DEPLOYMENT=your-deployment-name
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_PROJECT_ID=your-project-document-id
```

## Testing

Tests use Vitest with happy-dom. Setup in `src/__tests__/setup.ts` mocks @react-three/xr and resets Zustand stores before each test.
