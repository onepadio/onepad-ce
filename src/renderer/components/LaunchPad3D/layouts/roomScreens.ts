import type { CardPose } from "../types";

/** Soft cap for large spaces */
export const SCENE_SCREEN_MAX = 36;

/** Base screen content size */
export const SCENE_SCREEN_W = 1.85;
export const SCENE_SCREEN_H = 1.05;

const CARD_W = 2.4;
const CARD_H = 1.5;

/** Circle center / floor height for the arena */
export const ARENA_CENTER: [number, number, number] = [0, 0, 0];
export const ARENA_FLOOR_Y = -2.2;

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

/** Rows grow with icon count so 20+ still readable on a cylinder */
export function getSceneGrid(count: number): { cols: number; rows: number } {
  const n = Math.max(0, Math.min(count, SCENE_SCREEN_MAX));
  if (n <= 0) return { cols: 0, rows: 0 };
  if (n <= 7) return { cols: n, rows: 1 };
  if (n <= 14) return { cols: Math.ceil(n / 2), rows: 2 };
  if (n <= 24) return { cols: Math.ceil(n / 3), rows: 3 };
  return { cols: Math.ceil(n / 4), rows: 4 };
}

export function getSceneColumns(count: number): number {
  return getSceneGrid(count).cols;
}

export function getArenaRadius(count: number): number {
  const n = Math.max(1, Math.min(count, SCENE_SCREEN_MAX));
  const { cols } = getSceneGrid(n);
  const density = cols;
  const sizeScale =
    density <= 6 ? 1 : density <= 10 ? 0.9 : density <= 14 ? 0.8 : 0.7;
  const w = SCENE_SCREEN_W * sizeScale;
  const gap = 0.28 * sizeScale;
  const chord = w + gap;
  // Full ring once we have enough columns; otherwise a front-facing arc
  const fullCircle = cols >= 6;
  const angleStep = fullCircle
    ? (Math.PI * 2) / cols
    : Math.max(0.22, Math.min(0.55, chord / 8));
  const radius = fullCircle
    ? chord / (2 * Math.sin(Math.max(angleStep / 2, 0.05)))
    : Math.max(7, (cols * chord) / (Math.PI * 0.95));
  return Math.min(22, Math.max(6.5, radius));
}

/**
 * One slot per icon on a cylindrical wall, facing the arena center.
 * Bottom row left→right, then upper rows.
 */
export function getSceneScreenSlots(count: number): ScreenSlot[] {
  const n = Math.max(0, Math.min(count, SCENE_SCREEN_MAX));
  const { cols, rows } = getSceneGrid(n);
  if (n === 0 || cols === 0) return [];

  const density = cols;
  const sizeScale =
    density <= 6 ? 1 : density <= 10 ? 0.9 : density <= 14 ? 0.8 : 0.7;
  const w = SCENE_SCREEN_W * sizeScale;
  const h = SCENE_SCREEN_H * sizeScale;
  const gapY = 0.26 * sizeScale;
  const pitchY = h + gapY;
  const radius = getArenaRadius(n);
  const fullCircle = cols >= 6;
  const angleStep = fullCircle
    ? (Math.PI * 2) / cols
    : Math.min(0.55, (w + 0.28 * sizeScale) / radius);
  const span = fullCircle ? Math.PI * 2 : angleStep * Math.max(cols - 1, 0);

  const midRowY = 0.55 + ((rows - 1) / 2) * pitchY * 0.15;
  const slots: ScreenSlot[] = [];

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rowCount = Math.min(cols, n - row * cols);
    // Center short last rows on the arc
    const colOffset = (cols - rowCount) / 2;
    const colIndex = col + colOffset;
    const theta = fullCircle
      ? -Math.PI + colIndex * angleStep + angleStep / 2
      : -span / 2 + colIndex * angleStep;
    const x = radius * Math.sin(theta);
    const z = -radius * Math.cos(theta);
    const y = midRowY + ((rows - 1) / 2 - row) * pitchY;
    slots.push({
      col,
      row,
      width: w,
      height: h,
      radius,
      theta,
      position: [x, y, z],
      // Face inward toward arena center
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
  return Math.min(w / CARD_W, h / CARD_H) * 0.96;
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
      position: [0, 0.8, -6],
      rotation: [0, 0, 0],
      scale,
      opacity: 0,
    };
  }
  const focused = index === focusedIndex;
  const [x, y, z] = slot.position;
  // Nudge slightly inward so the card sits in front of the bezel
  const inward = 0.08;
  const nx = -Math.sin(slot.theta) * inward;
  const nz = Math.cos(slot.theta) * inward;
  return {
    position: [x + nx, y, z + nz],
    rotation: slot.rotation,
    scale: focused ? scale * 1.02 : scale,
    opacity: focused ? 1 : 0.9,
  };
}

/** Stand in the arena center and look toward the front of the wall */
export function getSceneOverviewCamera(count = 1): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const n = Math.max(count, 1);
  const { rows, cols } = getSceneGrid(n);
  const slots = getSceneScreenSlots(n);
  const eyeY =
    slots.length > 0
      ? slots.reduce((s, sl) => s + sl.position[1], 0) / slots.length
      : 0.9 + rows * 0.05;
  // Orbit target = center; camera sits a tiny step off-center so controls work
  const standOff = 0.55;
  return {
    position: [0, eyeY, standOff],
    lookAt: [0, eyeY, 0],
    fov: cols >= 12 ? 68 : cols >= 8 ? 64 : 60,
  };
}

/** Dolly in along the screen's inward normal */
export function getSceneScreenCamera(
  index: number,
  count: number
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
} {
  const slot = getScreenSlot(index, count);
  if (!slot) return getSceneOverviewCamera(count);
  const [x, y, z] = slot.position;
  const distance = 1.35 + slot.width * 0.25;
  const ix = -Math.sin(slot.theta);
  const iz = Math.cos(slot.theta);
  return {
    position: [x + ix * distance, y + 0.05, z + iz * distance],
    lookAt: [x, y, z],
    fov: 40,
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
