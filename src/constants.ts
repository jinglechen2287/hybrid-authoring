import type { TriggerType } from "~/types";

// ============================================================================
// SCALE CONSTANTS
// ============================================================================

/** Scale values for interactive handles and meshes */
export const SCALES = {
  /** Small handle default (0.02) and hover (0.025) */
  HANDLE_SMALL: { default: 0.02, hover: 0.025 },
  /** Medium handle default (0.03) and hover (0.035) */
  HANDLE_MEDIUM: { default: 0.03, hover: 0.035 },
  /** State handle add/remove default (0.032) and hover (0.036) */
  STATE_HANDLE: { default: 0.032, hover: 0.036 },
  /** Connect handle default (0.038) and hover (0.042) */
  CONNECT_HANDLE: { default: 0.038, hover: 0.042 },
  /** Scene rotate/scale handle default (0.03) and hover (0.04) */
  ROTATE_SCALE_HANDLE: { default: 0.03, hover: 0.04 },
  /** Scene transform handle default (0.1) and hover (0.125) */
  TRANSFORM_HANDLE: { default: 0.1, hover: 0.125 },
  /** Ghost state preview mesh scale factor */
  GHOST_STATE_SCALE: 0.02,
  /** Object mesh base scale */
  OBJECT_MESH: 0.1,
} as const;

// ============================================================================
// FONT SIZES
// ============================================================================

/** Font sizes for 3D text elements */
export const FONT_SIZES = {
  /** State label font size */
  STATE_LABEL: 0.025,
  /** Trigger indicator text font size */
  TRIGGER_INDICATOR: 0.5,
} as const;

// ============================================================================
// EMISSIVE INTENSITY
// ============================================================================

/** Emissive intensity values for mesh highlighting */
export const EMISSIVE = {
  /** No emissive glow */
  OFF: 0,
  /** Hover/selected glow */
  ON: 0.3,
} as const;

// ============================================================================
// TRIGGER CONFIGURATION
// ============================================================================

/** Order of trigger types for cycling through connect mode */
export const TRIGGER_ORDER: TriggerType[] = [
  "click",
  "hoverStart",
  "hoverEnd",
  "auto",
  "",
];

/** Color mapping for transition trigger types */
export const TRIGGER_COLORS: Record<TriggerType, string> = {
  click: "orangered",
  hoverStart: "skyblue",
  hoverEnd: "green",
  auto: "white",
  "": "gray",
};

/**
 * Gets the color for a given trigger type
 */
export function getTransitionColor(trigger: TriggerType): string {
  return TRIGGER_COLORS[trigger] ?? "gray";
}

// ============================================================================
// ANIMATION TIMING
// ============================================================================

/** Debounce timing constants */
export const DEBOUNCE_TIMING = {
  /** Debounce delay in milliseconds for Convex updates (scene/editor) */
  DEBOUNCE_MS: 10,
  /** Maximum wait time in milliseconds for debounced updates (scene/editor) */
  MAX_WAIT_MS: 50,
  /** Debounce delay in milliseconds for camera sync (shorter for responsiveness) */
  CAMERA_DEBOUNCE_MS: 100,
  /** Maximum wait time for camera sync during continuous manipulation */
  CAMERA_MAX_WAIT_MS: 200,
} as const;

// ============================================================================
// LINE STYLING
// ============================================================================

/** Line width values for visual connections */
export const LINE_WIDTH = {
  /** Default line width */
  DEFAULT: 0.005,
  /** Hover line width */
  HOVER: 0.008,
  /** Connection line width */
  CONNECTION: 1,
} as const;
