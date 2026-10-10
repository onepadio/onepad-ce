import {
  ARENA_FLOOR_Y,
  OVERVIEW_DIST,
  SCENE_SCREEN_H,
  SCENE_SCREEN_W,
  SCENE_SCREEN_Y,
  getArenaRadius,
} from "../layouts/roomScreens";

/**
 * Shared desk bounding box used by every world table.
 * Variants may change material / silhouette but must stay inside this volume
 * so the monitor, camera, and webview projection stay aligned.
 */
export type DeskLayout = {
  radius: number;
  frontZ: number;
  camZ: number;
  deskW: number;
  deskDepth: number;
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
};

export function getDeskLayout(count: number): DeskLayout {
  const n = Math.max(count, 1);
  const radius = getArenaRadius(n);
  const frontZ = -radius;
  const camZ = frontZ + OVERVIEW_DIST;
  const deskDepth = Math.max(4.5, OVERVIEW_DIST - 0.95);
  const deskW = SCENE_SCREEN_W * 1.22;
  const cardScale =
    Math.min(SCENE_SCREEN_W / 2.4, SCENE_SCREEN_H / 1.5) * 0.98;
  const contentH = 1.5 * cardScale;
  const frameBorder = 0.14;
  const topY = SCENE_SCREEN_Y - (contentH / 2 + frameBorder) - 0.5;
  const topThick = 0.14;
  const legH = Math.max(0.55, topY - ARENA_FLOOR_Y - 0.06);
  const deskCenterZ = frontZ + deskDepth * 0.5;

  return {
    radius,
    frontZ,
    camZ,
    deskW,
    deskDepth,
    topY,
    topThick,
    legH,
    deskCenterZ,
    legInsetX: deskW * 0.4,
    legZs: [
      frontZ + 0.35,
      frontZ + deskDepth * 0.4,
      frontZ + deskDepth * 0.7,
      frontZ + deskDepth * 0.93,
    ],
    floorY: ARENA_FLOOR_Y,
  };
}

/** Leg height from under a slab of `slabH` down to the floor. */
export function supportHeight(layout: DeskLayout, slabH: number): number {
  return Math.max(0.4, layout.topY - slabH - layout.floorY - 0.04);
}
