import type { CardPose, LayoutComputeArgs, Launchpad3dLayoutId } from "../types";
import {
  computeSceneScreenPose,
  computeDeskScreenPose,
  getSceneOverviewCamera,
  getSceneScreenCamera,
  applySceneZoomDistance,
  getSceneColumns as getSceneColumnsForCount,
  SCENE_SCREEN_MAX,
} from "./roomScreens";

export {
  getSceneOverviewCamera,
  getSceneScreenCamera,
  getSceneScreenSlots,
  getSceneGrid,
  applySceneZoomDistance,
  SCENE_SCREEN_MAX,
} from "./roomScreens";

const CARD_W = 2.4;
const CARD_GAP = 0.55;

export function computeCoverFlowPose({
  index,
  focusedIndex,
  browseOffset,
}: LayoutComputeArgs): CardPose {
  const offset = index - (focusedIndex + browseOffset);
  const abs = Math.abs(offset);
  const side = Math.sign(offset) || 0;
  const x = offset * (CARD_W * 0.55 + CARD_GAP * 0.2);
  const z = -Math.min(abs, 6) * 0.85;
  const y = -Math.min(abs, 4) * 0.05;
  const rotY = side * Math.min(abs, 3) * 0.45;
  const scale = Math.max(0.55, 1 - abs * 0.08);
  const opacity = Math.max(0.35, 1 - abs * 0.12);
  return {
    position: [x, y, z],
    rotation: [0, -rotY, 0],
    scale,
    opacity,
  };
}

export const MISSION_SPACING_Y = 1.7;
export const MISSION_SPACING_X = 2.4 + 0.35;

export function getMissionColumns(count: number): number {
  return Math.max(2, Math.ceil(Math.sqrt(Math.max(count, 1))));
}

export function getMissionGridMeta(count: number) {
  const cols = getMissionColumns(count);
  const rows = Math.max(1, Math.ceil(Math.max(count, 1) / cols));
  const halfH = ((rows - 1) / 2) * MISSION_SPACING_Y;
  return { cols, rows, halfH, spacingY: MISSION_SPACING_Y, spacingX: MISSION_SPACING_X };
}

/** Y of a mission card in world space (row 0 at top). */
export function getMissionCardY(index: number, count: number): number {
  const { cols, rows, spacingY } = getMissionGridMeta(count);
  const row = Math.floor(index / cols);
  return ((rows - 1) / 2 - row) * spacingY;
}

export function getMissionCardX(index: number, count: number): number {
  const { cols, spacingX } = getMissionGridMeta(count);
  const col = index % cols;
  return (col - (cols - 1) / 2) * spacingX;
}

/** Mission card tilt around X (matches MissionLayout pose). */
const MISSION_CARD_TILT = 0.18;

/**
 * Close-up camera on a mission icon.
 * approach = pull in from further back; front = square-on along card normal.
 */
export function getMissionIconCamera(
  index: number,
  count: number,
  phase: "approach" | "front" = "front"
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
} {
  const x = getMissionCardX(index, count);
  const y = getMissionCardY(index, count);
  const ny = Math.sin(MISSION_CARD_TILT);
  const nz = Math.cos(MISSION_CARD_TILT);
  const dist = phase === "front" ? 3.2 : 4.9;
  const lift = phase === "approach" ? 0.42 : 0.06;
  return {
    position: [x, y + ny * dist + lift, nz * dist],
    lookAt: [x, y, 0],
    fov: phase === "front" ? 34 : 40,
  };
}

/** Max |scrollY| so the grid can still fill the viewport. */
export function getMissionScrollLimits(count: number): number {
  const { halfH } = getMissionGridMeta(count);
  return Math.max(0, halfH - 1.6);
}

/** Base camera Z before user zoom (pulls back for tall grids). */
export function getMissionBaseDistance(count: number): number {
  const { halfH } = getMissionGridMeta(count);
  return 9.5 + Math.max(0, halfH - 2.5) * 0.45;
}

export function getMissionDefaultZoom(count: number): number {
  return getMissionBaseDistance(count);
}

export function clampMissionZoom(zoom: number, count: number): number {
  const base = getMissionBaseDistance(count);
  return Math.min(base + 10, Math.max(4.5, zoom));
}

/**
 * Ring radius grows gently with count, then caps so the front arc
 * never sits behind a typical camera distance.
 */
export function getRingRadius(count: number): number {
  const n = Math.max(count, 1);
  return Math.min(7.2, Math.max(3.2, 2.6 + n * 0.2));
}

export function getRingFrontZ(count: number): number {
  return getRingRadius(count) * 0.65;
}

/** Default camera distance past the front card (+Z). */
export function getRingDefaultZoom(count: number): number {
  const n = Math.max(count, 1);
  return Math.min(10, Math.max(4.2, 3.6 + n * 0.12));
}

export function clampRingZoom(zoom: number): number {
  return Math.min(16, Math.max(2.4, zoom));
}

/** Pitch of the ring camera around the look-at (radians). */
export function clampRingViewPitch(pitch: number): number {
  return Math.min(0.95, Math.max(-0.35, pitch));
}

/** Close-up facing a ring card from its front (outward normal). */
export function getRingCardFrontCamera(
  index: number,
  count: number,
  focusedIndex: number,
  browseOffset = 0,
  distance = 2.7
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
} {
  const pose = computeCircularRingPose({
    index,
    count,
    focusedIndex,
    browseOffset,
  });
  const [x, y, z] = pose.position;
  const n = Math.max(count, 1);
  const angleStep = (Math.PI * 2) / n;
  const focusAngle = (focusedIndex + browseOffset) * angleStep;
  const angle = index * angleStep - focusAngle;
  const nx = Math.sin(angle);
  const nz = Math.cos(angle);
  return {
    position: [x + nx * distance, y + 0.12, z + nz * distance],
    lookAt: [x, y, z],
    fov: 34,
  };
}

/** @deprecated prefer getRingCardFrontCamera — kept for overview front slot */
export function getRingIconCamera(
  count: number,
  ringViewPitch: number | null = 0
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
} {
  return getRingCardFrontCamera(0, count, 0, 0, 2.65);
}

export function computeMissionControlPose({
  index,
  count,
  focusedIndex,
}: LayoutComputeArgs): CardPose {
  const { cols, rows, spacingX, spacingY } = getMissionGridMeta(count);
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = (col - (cols - 1) / 2) * spacingX;
  const y = ((rows - 1) / 2 - row) * spacingY;
  const isFocused = index === focusedIndex;
  const z = isFocused ? 0.6 : 0;
  const scale = isFocused ? 1.12 : 0.92;
  return {
    position: [x, y, z],
    rotation: [-0.18, 0, 0],
    scale,
    opacity: isFocused ? 1 : 0.85,
  };
}

export function computeCircularRingPose({
  index,
  count,
  focusedIndex,
  browseOffset,
}: LayoutComputeArgs): CardPose {
  const n = Math.max(count, 1);
  const radius = getRingRadius(n);
  const angleStep = (Math.PI * 2) / n;
  const focusAngle = (focusedIndex + browseOffset) * angleStep;
  const angle = index * angleStep - focusAngle;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius - radius * 0.35;
  const y = Math.sin(angle * 2) * 0.08;
  const facing = -angle;
  const distFromFront = Math.abs(((angle + Math.PI) % (Math.PI * 2)) - Math.PI);
  const frontness = 1 - Math.min(distFromFront / Math.PI, 1);
  // Slightly smaller cards when the ring is dense
  const density = Math.min(1, n / 18);
  const scale = 0.62 + frontness * 0.38 - density * 0.08;
  const opacity = 0.45 + frontness * 0.55;
  return {
    position: [x, y, z],
    rotation: [0, facing, 0],
    scale,
    opacity,
  };
}

export function computeSceneConsolePose({
  index,
  focusedIndex,
  count,
  deskFixed = false,
  sceneAngleOffset = 0,
}: LayoutComputeArgs): CardPose {
  if (deskFixed) {
    return computeDeskScreenPose(
      index,
      focusedIndex,
      count,
      sceneAngleOffset
    );
  }
  return computeSceneScreenPose(index, focusedIndex, count);
}

export function computeCardPose(
  layout: Launchpad3dLayoutId,
  args: LayoutComputeArgs,
  scale = 1
): CardPose {
  let pose: CardPose;
  switch (layout) {
    case "mission":
      pose = computeMissionControlPose(args);
      break;
    case "ring":
      pose = computeCircularRingPose(args);
      break;
    case "scene":
      return computeSceneConsolePose(args);
    case "coverflow":
    default:
      pose = computeCoverFlowPose(args);
  }
  if (scale === 1) return pose;
  return {
    position: [
      pose.position[0] * scale,
      pose.position[1] * scale,
      pose.position[2] * scale,
    ],
    rotation: pose.rotation,
    scale: pose.scale * Math.min(scale, 1.35),
    opacity: pose.opacity,
  };
}

export function usesRoomScene(layout: Launchpad3dLayoutId): boolean {
  return layout === "scene";
}

export function getCameraTargetForLayout(
  layout: Launchpad3dLayoutId,
  roomScene = false,
  focusedIndex = 0,
  zoomToScreen = false,
  cardCount = 1,
  overviewZoomDistance: number | null = null,
  ringZoomDistance: number | null = null,
  missionScrollY: number | null = null,
  missionZoomDistance: number | null = null,
  ringViewPitch: number | null = null,
  ringZoomCardIndex: number | null = null,
  browseOffset = 0,
  ringZoomPhase: "approach" | "front" | null = null,
  sceneAngleOffset = 0
): {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
} {
  if (roomScene || layout === "scene") {
    if (zoomToScreen && focusedIndex >= 0) {
      return getSceneScreenCamera(focusedIndex, cardCount);
    }
    return applySceneZoomDistance(
      getSceneOverviewCamera(cardCount, focusedIndex, sceneAngleOffset),
      overviewZoomDistance
    );
  }
  switch (layout) {
    case "mission": {
      if (zoomToScreen && focusedIndex >= 0) {
        return getMissionIconCamera(
          focusedIndex,
          cardCount,
          ringZoomPhase === "front" ? "front" : "approach"
        );
      }
      const limit = getMissionScrollLimits(cardCount);
      const sy = Math.min(limit, Math.max(-limit, missionScrollY ?? 0));
      const z = clampMissionZoom(
        missionZoomDistance ?? getMissionDefaultZoom(cardCount),
        cardCount
      );
      return {
        position: [0, 0.35 + sy, z],
        lookAt: [0, sy, 0],
        fov: 45,
      };
    }
    case "ring": {
      if (zoomToScreen && ringZoomCardIndex != null && ringZoomCardIndex >= 0) {
        const dist = ringZoomPhase === "front" ? 2.55 : 4.15;
        return getRingCardFrontCamera(
          ringZoomCardIndex,
          cardCount,
          focusedIndex,
          browseOffset,
          dist
        );
      }
      const frontZ = getRingFrontZ(cardCount);
      const zoom = clampRingZoom(
        ringZoomDistance ?? getRingDefaultZoom(cardCount)
      );
      const lookAt: [number, number, number] = [0, 0.15, frontZ * 0.25];
      const basePos: [number, number, number] = [0, 1.35, frontZ + zoom];
      const pitch = clampRingViewPitch(ringViewPitch ?? 0);
      // Offset from look-at, then pitch around X for a higher/lower view angle
      const ox = basePos[0] - lookAt[0];
      const oy = basePos[1] - lookAt[1];
      const oz = basePos[2] - lookAt[2];
      const cos = Math.cos(pitch);
      const sin = Math.sin(pitch);
      const ry = oy * cos - oz * sin;
      const rz = oy * sin + oz * cos;
      return {
        position: [lookAt[0] + ox, lookAt[1] + ry, lookAt[2] + rz],
        lookAt,
        fov: 42,
      };
    }
    case "coverflow":
    default:
      return { position: [0, 0.2, 7.2], lookAt: [0, 0, 0], fov: 45 };
  }
}

export function getSceneColumns(count: number): number {
  return getSceneColumnsForCount(count);
}

export function getSceneMaxCards(): number {
  return SCENE_SCREEN_MAX;
}
