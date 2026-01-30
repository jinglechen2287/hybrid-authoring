import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Transform validator
const transform = v.object({
  position: v.array(v.number()),
  rotation: v.array(v.number()),
  scale: v.array(v.number()),
});

// ObjState validator
const objState = v.object({
  id: v.string(),
  transform,
  trigger: v.union(
    v.literal("click"),
    v.literal("hoverStart"),
    v.literal("hoverEnd"),
    v.literal("auto"),
    v.literal("")
  ),
  transitionTo: v.string(),
});

// SceneObj validator
const sceneObj = v.object({
  type: v.union(v.literal("sphere"), v.literal("cube"), v.literal("cone")),
  name: v.string(),
  states: v.array(objState),
});

// RoomPlaneData validator
const roomPlaneData = v.object({
  id: v.string(),
  semanticLabel: v.optional(v.string()),
  orientation: v.union(v.literal("horizontal"), v.literal("vertical")),
  poseMatrix: v.array(v.number()),
  polygon: v.array(
    v.object({
      x: v.number(),
      y: v.number(),
      z: v.number(),
    })
  ),
});

export default defineSchema({
  projects: defineTable({
    // Scene data
    lightPosition: v.array(v.number()),
    content: v.record(v.string(), sceneObj),

    // Editor data
    mode: v.union(v.literal("edit"), v.literal("play")),
    selectedObjId: v.optional(v.string()),
    objStateIdxMap: v.record(v.string(), v.number()),
    isHybrid: v.boolean(),

    // Camera data
    cameraDistance: v.number(),
    cameraYaw: v.number(),
    cameraPitch: v.number(),
    cameraOrigin: v.array(v.number()),

    // Room data (one-shot, not realtime)
    room: v.array(roomPlaneData),
  }),
});
