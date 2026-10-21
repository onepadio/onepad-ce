import {
  ARENA_FLOOR_Y,
  SCENE_SCREEN_H,
  SCENE_SCREEN_W,
  SCENE_SCREEN_Y,
  getDeskArenaRadius,
  getDeskSlotCount,
} from "../layouts/roomScreens";

/**
 * Shared desk bounding box used by every world table.
 * Circular desk: variants may change material / silhouette but must stay
 * inside this volume so monitors, camera, and webview projection stay aligned.
 */
export type DeskLayout = {
  radius: number;
  frontZ: number;
  camZ: number;
  deskW: number;
  deskDepth: number;
  /** Outer radius of the circular table top */
  tableRadius: number;
  /** Top surface Y (same for all worlds) */
  topY: number;
  /** Nominal top slab thickness — variants may use ±20% but top face stays at topY */
  topThick: number;
  legH: number;
  deskCenterZ: number;
  /** Half-extents for leg placement inside the footprint */
  legInsetX: number;
  legZs: number[];
  floorY: number;
  slotCount: number;
};

export function getDeskLayout(windowCount: number): DeskLayout {
  const slotCount = Math.max(1, getDeskSlotCount(windowCount));
  const radius = getDeskArenaRadius();
  const frontZ = -radius;
  const camZ = 0;
  // Table must reach past monitor stand bases (stands sit ~0.2 inward from
  // the screen ring). Too small a radius leaves stands floating over the floor.
  const tableRadius = Math.max(3.4, radius - 0.05);
  const deskDepth = tableRadius * 2;
  const deskW = tableRadius * 2;
  const cardScale =
    Math.min(SCENE_SCREEN_W / 2.4, SCENE_SCREEN_H / 1.5) * 0.98;
  const contentH = 1.5 * cardScale;
  const frameBorder = 0.14;
  const topY = SCENE_SCREEN_Y - (contentH / 2 + frameBorder) - 0.5;
  const topThick = 0.14;
  const legH = Math.max(0.55, topY - ARENA_FLOOR_Y - 0.06);
  const deskCenterZ = 0;
  const legR = tableRadius * 0.55;

  return {
    radius,
    frontZ,
    camZ,
    deskW,
    deskDepth,
    tableRadius,
    topY,
    topThick,
    legH,
    deskCenterZ,
    legInsetX: legR,
    legZs: [-legR, legR],
    floorY: ARENA_FLOOR_Y,
    slotCount,
  };
}

/** Leg height from under a slab of `slabH` down to the floor. */
export function supportHeight(layout: DeskLayout, slabH: number): number {
  return Math.max(0.4, layout.topY - slabH - layout.floorY - 0.04);
}
