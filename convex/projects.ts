import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Transform validator (reusable)
const transformValidator = v.object({
  position: v.array(v.number()),
  rotation: v.array(v.number()),
  scale: v.array(v.number()),
});

// ObjState validator
const objStateValidator = v.object({
  id: v.string(),
  transform: transformValidator,
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
const sceneObjValidator = v.object({
  type: v.union(v.literal("sphere"), v.literal("cube"), v.literal("cone")),
  name: v.string(),
  states: v.array(objStateValidator),
});

// RoomPlaneData validator
const roomPlaneDataValidator = v.object({
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

// ============ QUERIES ============

export const getScene = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return {
      lightPosition: project.lightPosition,
      content: project.content,
    };
  },
});

export const getEditor = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return {
      mode: project.mode,
      selectedObjId: project.selectedObjId,
      objStateIdxMap: project.objStateIdxMap,
      isHybrid: project.isHybrid,
    };
  },
});

export const getCamera = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return {
      distance: project.cameraDistance,
      yaw: project.cameraYaw,
      pitch: project.cameraPitch,
      origin: project.cameraOrigin,
    };
  },
});

export const getRoom = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    return project.room;
  },
});

// ============ MUTATIONS ============

export const updateScene = mutation({
  args: {
    projectId: v.id("projects"),
    lightPosition: v.array(v.number()),
    content: v.record(v.string(), sceneObjValidator),
  },
  handler: async (ctx, { projectId, lightPosition, content }) => {
    await ctx.db.patch(projectId, { lightPosition, content });
  },
});

export const updateEditor = mutation({
  args: {
    projectId: v.id("projects"),
    mode: v.union(v.literal("edit"), v.literal("play")),
    selectedObjId: v.optional(v.string()),
    objStateIdxMap: v.record(v.string(), v.number()),
    isHybrid: v.boolean(),
  },
  handler: async (
    ctx,
    { projectId, mode, selectedObjId, objStateIdxMap, isHybrid }
  ) => {
    await ctx.db.patch(projectId, {
      mode,
      selectedObjId,
      objStateIdxMap,
      isHybrid,
    });
  },
});

export const updateCamera = mutation({
  args: {
    projectId: v.id("projects"),
    distance: v.number(),
    yaw: v.number(),
    pitch: v.number(),
    origin: v.array(v.number()),
  },
  handler: async (ctx, { projectId, distance, yaw, pitch, origin }) => {
    await ctx.db.patch(projectId, {
      cameraDistance: distance,
      cameraYaw: yaw,
      cameraPitch: pitch,
      cameraOrigin: origin,
    });
  },
});

export const updateRoom = mutation({
  args: {
    projectId: v.id("projects"),
    room: v.array(roomPlaneDataValidator),
  },
  handler: async (ctx, { projectId, room }) => {
    await ctx.db.patch(projectId, { room });
  },
});
