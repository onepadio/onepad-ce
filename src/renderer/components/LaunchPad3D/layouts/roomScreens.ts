import type { CardPose } from "../types";

/** Soft cap — single-row ring stays readable while orbiting */
export const SCENE_SCREEN_MAX = 128;

/**
 * Physical screen size on the wall.
 * Large enough so that at OVERVIEW_DIST the webview fills ~70 % of screen width.
 */
export const SCENE_SCREEN_W = 6.4;
export const SCENE_SCREEN_H = 3.8;
export const SCENE_SCREEN_GAP = 4.0;
export const SCENE_SCREEN_Y = 0.5;
/** Outer frame corner radius (world units) */
export const DESK_FRAME_RADIUS = 0.28;

const CARD_W = 2.4;
const CARD_H = 1.5;

/** Circle center / floor height for the arena */
export const ARENA_CENTER: [number, number, number] = [0, 0, 0];
export const ARENA_FLOOR_Y = -2.8;

/**
 * Camera sits this many units from the WALL SURFACE of the focused screen.
 * Keep fixed — do NOT pull back when window count grows (that packed neighbors
 * into view and made Electron paint multiple webviews).
 */
export const OVERVIEW_DIST = 8.2;
const DOLLY_DIST = 1.8;
/** Fixed FOV so the front screen stays dominant regardless of ring size */
const OVERVIEW_FOV = 56;

/**
 * Desk-room work camera: always seated looking at the front (−Z) screen slot.
 * The screen ring rotates under this fixed view when focus changes.
 */
export function getDeskWorkCamera(count = 1): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const radius = getArenaRadius(Math.max(count, 1));
  const eyeY = SCENE_SCREEN_Y;
  return {
    position: [0, eyeY, -radius + OVERVIEW_DIST],
    lookAt: [0, eyeY, -radius],
    fov: OVERVIEW_FOV,
  };
}

export interface ScreenSlot {
  position: [number, number, number];
  /** Yaw that faces the screen toward the arena center */
  rotation: [number, number, number];
  col: number;
  row: number;
  width: number;
  height: number;
  radius: number;
  theta: number;
}

/** Always a single row — orbit to browse the endless ring */
export function getSceneGrid(count: number): { cols: number; rows: number } {
  const n = Math.max(0, Math.min(count, SCENE_SCREEN_MAX));
  return { cols: n, rows: n > 0 ? 1 : 0 };
}

export function getSceneColumns(count: number): number {
  return getSceneGrid(count).cols;
}

/**
 * Radius grows with count so screens don't overlap.
 * Minimum is large enough to give good side-card visibility from OVERVIEW_DIST.
 */
export function getArenaRadius(count: number): number {
  const n = Math.max(1, Math.min(count, SCENE_SCREEN_MAX));
  const chord = SCENE_SCREEN_W + SCENE_SCREEN_GAP;
  const radius = (n * chord) / (2 * Math.PI);
  return Math.max(7.0, radius);
}

/**
 * One large screen per window on a single-row cylindrical wall.
 * Index 0 faces the default front (-Z).
 */
export function getSceneScreenSlots(count: number): ScreenSlot[] {
  const n = Math.max(0, Math.min(count, SCENE_SCREEN_MAX));
  if (n === 0) return [];

  const radius = getArenaRadius(n);
  const angleStep = (Math.PI * 2) / n;
  const w = SCENE_SCREEN_W;
  const h = SCENE_SCREEN_H;
  const slots: ScreenSlot[] = [];

  for (let i = 0; i < n; i++) {
    const theta = i * angleStep;
    const x = radius * Math.sin(theta);
    const z = -radius * Math.cos(theta);
    slots.push({
      col: i,
      row: 0,
      width: w,
      height: h,
      radius,
      theta,
      position: [x, SCENE_SCREEN_Y, z],
      rotation: [0, -theta, 0],
    });
  }
  return slots;
}

export function getScreenSlot(
  index: number,
  count: number
): ScreenSlot | null {
  const slots = getSceneScreenSlots(count);
  if (index < 0 || index >= slots.length) return null;
  return slots[index];
}

export function getSceneScreenCardScale(slot?: ScreenSlot | null): number {
  const w = slot?.width ?? SCENE_SCREEN_W;
  const h = slot?.height ?? SCENE_SCREEN_H;
  return Math.min(w / CARD_W, h / CARD_H) * 0.98;
}

export function computeSceneScreenPose(
  index: number,
  focusedIndex: number,
  count: number
): CardPose {
  const slot = getScreenSlot(index, count);
  const scale = getSceneScreenCardScale(slot);
  if (!slot) {
    return {
      position: [0, SCENE_SCREEN_Y, -8],
      rotation: [0, 0, 0],
      scale,
      opacity: 0,
    };
  }
  const focused = index === focusedIndex;
  const [x, y, z] = slot.position;
  const inward = 0.08;
  const nx = -Math.sin(slot.theta) * inward;
  const nz = Math.cos(slot.theta) * inward;

  const distFromFront = Math.min(
    ((index - focusedIndex + count) % count),
    ((focusedIndex - index + count) % count)
  );
  const scaleMult = focused ? 1.04 : 1.0;
  const opacity = focused ? 1 : distFromFront <= 1 ? 0.8 : 0.55;

  return {
    position: [x + nx, y, z + nz],
    rotation: slot.rotation,
    scale: scale * scaleMult,
    opacity,
  };
}

/**
 * Desk worlds: focused window is always on the fixed front (−Z) desk slot.
 * Neighbors sit at ±step — no parent ring rotation (avoids webview/order desync).
 */
export function computeDeskScreenPose(
  index: number,
  focusedIndex: number,
  count: number,
  angleOffset = 0
): CardPose {
  const n = Math.max(count, 1);
  const radius = getArenaRadius(n);
  const angleStep = (Math.PI * 2) / n;
  const scale = getSceneScreenCardScale(null);

  // Relative yaw: focused → 0 (front). Drag offset turns the carousel under the seat.
  let rel = (index - focusedIndex) * angleStep - angleOffset;
  // Normalize to (−π, π] so GSAP never takes the long way around
  const TWO_PI = Math.PI * 2;
  rel = ((rel + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;

  const x = radius * Math.sin(rel);
  const z = -radius * Math.cos(rel);

  // Visibility from visual angle (not discrete index) so continuous settle
  // matches control-room orbit — neighbors fade in while rotating onto the desk
  const absRel = Math.abs(rel);
  const nearFront = absRel < 0.12;
  const neighbor = absRel < angleStep * 1.05;

  return {
    position: [x, SCENE_SCREEN_Y, z],
    rotation: [0, -rel, 0],
    scale,
    opacity: nearFront ? 1 : neighbor ? 0.4 : 0,
  };
}

/**
 * Camera stands OVERVIEW_DIST in front of the focused wall screen.
 * `angleOffset` is a continuous radian offset added on top of focusedIndex's angle,
 * allowing smooth rotation while dragging (before snapping to next card).
 */
export function getSceneOverviewCamera(
  count = 1,
  focusedIndex = 0,
  angleOffset = 0
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const n = Math.max(count, 1);
  const radius = getArenaRadius(n);
  const angleStep = (Math.PI * 2) / n;
  const eyeY = SCENE_SCREEN_Y;

  // Continuous camera angle: card angle + drag offset
  const baseTheta = focusedIndex * angleStep;
  const theta = baseTheta + angleOffset;

  // Wall screen position at this angle
  const sx = radius * Math.sin(theta);
  const sz = -radius * Math.cos(theta);
  // Inward unit vector (toward ring center)
  const ix = -Math.sin(theta);
  const iz = Math.cos(theta);

  return {
    position: [sx + ix * OVERVIEW_DIST, eyeY, sz + iz * OVERVIEW_DIST],
    lookAt: [sx, eyeY, sz],
    // Never widen FOV with count — that "zoomed out" and showed multiple screens
    fov: OVERVIEW_FOV,
  };
}

/**
 * Convert a horizontal drag delta (pixels) to a scene rotation angle (radians).
 * dragSensitivity: how many pixels = one full revolution.
 */
export function dragDeltaToSceneAngle(
  dx: number,
  count: number,
  viewportW = window.innerWidth
): number {
  // One full card step = one angleStep in radians
  const n = Math.max(count, 1);
  const angleStep = (Math.PI * 2) / n;
  // ~viewportW * 0.6 pixels per full revolution feels natural
  const pixelsPerRev = viewportW * 0.65;
  return (-dx / pixelsPerRev) * Math.PI * 2;
}

/**
 * Snap a continuous angle offset to the nearest card index.
 * Returns the new focusedIndex and the remaining sub-card offset.
 */
export function snapSceneAngle(
  focusedIndex: number,
  angleOffset: number,
  count: number
): { index: number; remainder: number } {
  const n = Math.max(count, 1);
  const angleStep = (Math.PI * 2) / n;
  const steps = Math.round(angleOffset / angleStep);
  const newIndex = ((focusedIndex + steps) % n + n) % n;
  const remainder = angleOffset - steps * angleStep;
  return { index: newIndex, remainder };
}

/**
 * Dolly very close to the focused screen — webview fills most of viewport.
 */
export function getSceneScreenCamera(
  index: number,
  count: number
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const slot = getScreenSlot(index, count);
  if (!slot) return getSceneOverviewCamera(count, index);

  const [x, y, z] = slot.position;
  const ix = -Math.sin(slot.theta);
  const iz = Math.cos(slot.theta);

  return {
    position: [x + ix * DOLLY_DIST, y, z + iz * DOLLY_DIST],
    lookAt: [x, y, z],
    fov: 56,
  };
}

/** Place camera at `distance` along the vector from lookAt through the default overview pos */
export function applySceneZoomDistance(
  cam: {
    position: [number, number, number];
    lookAt: [number, number, number];
    fov: number;
  },
  distance: number | null | undefined
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  if (distance == null || !Number.isFinite(distance) || distance <= 0) {
    return cam;
  }
  const [lx, ly, lz] = cam.lookAt;
  const [px, py, pz] = cam.position;
  const dx = px - lx;
  const dy = py - ly;
  const dz = pz - lz;
  const len = Math.hypot(dx, dy, dz) || 1;
  const scale = distance / len;
  return {
    ...cam,
    position: [lx + dx * scale, ly + dy * scale, lz + dz * scale],
  };
}

/** Index whose screen faces closest to the camera (front of view). */
export function getSceneFrontIndex(
  count: number,
  cameraX: number,
  cameraZ: number
): number {
  const n = Math.max(0, Math.min(count, SCENE_SCREEN_MAX));
  if (n <= 0) return 0;
  // Camera is now near the wall, not at center — find closest slot
  let best = 0;
  let bestDist = Infinity;
  const slots = getSceneScreenSlots(n);
  for (let i = 0; i < n; i++) {
    const [sx, , sz] = slots[i].position;
    const d = (cameraX - sx) ** 2 + (cameraZ - sz) ** 2;
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return best;
}
