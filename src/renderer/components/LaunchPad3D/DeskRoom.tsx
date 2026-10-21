import { useMemo } from "react";
import * as THREE from "three";

import { getDeskLayout, getDeskTable } from "./desks";
import DeskProps from "./experiences/DeskProps";
import DeskSurfaceProps from "./experiences/DeskSurfaceProps";
import {
  ARENA_FLOOR_Y,
  DESK_FRAME_BORDER,
  DESK_FRAME_RADIUS,
  DESK_SCREEN_PLATE_H,
  DESK_SCREEN_PLATE_W,
  SCENE_SCREEN_H,
  SCENE_SCREEN_W,
  SCENE_SCREEN_Y,
  getDeskArenaRadius,
  getDeskScreenSlots,
  getDeskSlotCount,
} from "./layouts/roomScreens";

export const DESK_ROOM = {
  windowSize: [5.2, 3.2] as [number, number],
  deskTopY: ARENA_FLOOR_Y + 0.72,
  /** Explore: turn around from the seat toward +Z vista */
  exploreCamPos: [0, 1.4, 1.2] as [number, number, number],
  exploreLookAt: [0, 1.2, 8] as [number, number, number],
};

/** Rounded-rect path centered on origin (XY plane). */
function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w - 0.01, h - 0.01);
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

function makeRoundedFrameGeometry(
  outerW: number,
  outerH: number,
  innerW: number,
  innerH: number,
  cornerR: number,
  depth: number
) {
  const outer = roundedRectShape(outerW, outerH, cornerR);
  const hole = roundedRectShape(
    innerW,
    innerH,
    Math.max(0.04, cornerR * 0.7)
  );
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.018,
    bevelSegments: 2,
    curveSegments: 12,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

type DeskRoomProps = {
  count: number;
  exploreMode?: boolean;
  swapPulse?: number;
  active?: boolean;
  experienceId?: string | null;
  focusedIndex?: number;
  /** Matches projected webview opacity so glass doesn't fight the overlay */
  screenOpacity?: number;
};

/**
 * Circular desk shell: floor, round table, N≤6 monitor frames around the seat.
 */
function DeskRoom({
  count,
  exploreMode = false,
  experienceId = null,
  focusedIndex = 0,
  screenOpacity = 0.7,
}: DeskRoomProps) {
  const slotCount = getDeskSlotCount(count);
  const layout = useMemo(() => getDeskLayout(count), [count]);
  const { topY, tableRadius } = layout;
  const radius = getDeskArenaRadius();

  const DeskTable = useMemo(
    () => getDeskTable(experienceId),
    [experienceId]
  );

  const isLibrary = experienceId === "library-hall";
  const isOffice = experienceId === "office-tower";
  const isVictorian = experienceId === "victorian-study";
  const isClassicInterior = isLibrary || isVictorian;
  /** Full interior GLB supplies the floor */
  const hideDeskFloor = isLibrary || isOffice || isVictorian;

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isClassicInterior ? "#4a3426" : "#3a4558",
        metalness: isClassicInterior ? 0.04 : 0.15,
        roughness: isClassicInterior ? 0.88 : 0.78,
      }),
    [isClassicInterior]
  );
  const bezelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isClassicInterior ? "#5a3828" : "#5a6a7c",
        metalness: isClassicInterior ? 0.08 : 0.4,
        roughness: isClassicInterior ? 0.7 : 0.45,
        envMapIntensity: isClassicInterior ? 0.25 : 1,
      }),
    [isClassicInterior]
  );
  const standMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isClassicInterior ? "#4a2e20" : "#4a5668",
        metalness: isClassicInterior ? 0.06 : 0.55,
        roughness: isClassicInterior ? 0.68 : 0.38,
        envMapIntensity: isClassicInterior ? 0.2 : 1,
      }),
    [isClassicInterior]
  );
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isClassicInterior ? "#5a4030" : "#4a5568",
        metalness: 0.08,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
    [isClassicInterior]
  );

  const frameMetrics = useMemo(() => {
    const scale =
      Math.min(SCENE_SCREEN_W / 2.4, SCENE_SCREEN_H / 1.5) * 0.98;
    // Opening == plate size used by CardMesh + WebViewProjector (flush fit).
    const contentW = DESK_SCREEN_PLATE_W * scale;
    const contentH = DESK_SCREEN_PLATE_H * scale;
    const border = DESK_FRAME_BORDER;
    const outerW = contentW + border * 2;
    const outerH = contentH + border * 2;
    return {
      contentW,
      contentH,
      outerW,
      outerH,
      frameBottomY: SCENE_SCREEN_Y - outerH / 2,
      geo: makeRoundedFrameGeometry(
        outerW,
        outerH,
        contentW,
        contentH,
        DESK_FRAME_RADIUS,
        0.1
      ),
    };
  }, []);

  const slots = useMemo(() => getDeskScreenSlots(slotCount), [slotCount]);

  const winW = DESK_ROOM.windowSize[0];
  const winH = DESK_ROOM.windowSize[1];
  const frame = 0.22;
  const windowZ = radius * 0.35 + 2.5;

  const frameBottomY = frameMetrics.frameBottomY;
  const neckTopY = frameBottomY + 0.04;
  const neckBottomY = topY + 0.02;
  const neckH = Math.max(0.2, neckTopY - neckBottomY);
  const neckMidY = (neckTopY + neckBottomY) * 0.5;

  return (
    <group>
      {!hideDeskFloor && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, ARENA_FLOOR_Y, 0]}
          material={floorMat}
          receiveShadow
        >
          <circleGeometry args={[radius + 2.5, 64]} />
        </mesh>
      )}

      <DeskTable layout={layout} />
      <DeskSurfaceProps topY={topY} />
      {/* Modern chair/plants clash with classic interiors */}
      {!isClassicInterior && <DeskProps />}

      {/* Monitor frames + stands at each desk slot */}
      {slots.map((slot, i) => {
        const [x, y, z] = slot.position;
        const [, ry] = slot.rotation;
        const standZLocal = 0.1;
        const lit = i === focusedIndex;
        return (
          <group key={`desk-mon-${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
            <mesh
              position={[0, 0, -0.12]}
              geometry={frameMetrics.geo}
              material={bezelMat}
              castShadow
            />
            <mesh
              position={[0, neckMidY - y, standZLocal]}
              material={standMat}
              castShadow
            >
              <boxGeometry args={[0.14, neckH, 0.08]} />
            </mesh>
            <mesh
              position={[0, frameBottomY - y + 0.02, standZLocal]}
              material={standMat}
              castShadow
            >
              <boxGeometry args={[0.28, 0.07, 0.1]} />
            </mesh>
            {/* Base plate flush on the desk top (half-height 0.03) */}
            <mesh
              position={[0, topY - y + 0.03, standZLocal + 0.12]}
              material={standMat}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.62, 0.06, 0.38]} />
            </mesh>
            {/* Screen glass — same size as bezel opening / projected webview */}
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry
                args={[frameMetrics.contentW, frameMetrics.contentH]}
              />
              <meshStandardMaterial
                color="#0d1524"
                emissive={lit ? "#1a4a8c" : "#101828"}
                emissiveIntensity={lit ? 0.12 : 0.04}
                metalness={0.15}
                roughness={0.55}
                transparent
                opacity={screenOpacity}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      <pointLight
        position={[0, topY + 0.45, 0]}
        intensity={isVictorian ? 0.28 : 0.55}
        color={isClassicInterior ? "#ffd8a0" : "#ffe8c8"}
        distance={tableRadius * 2.2}
        decay={2}
      />
      <pointLight
        position={[0, ARENA_FLOOR_Y + 3.2, 0]}
        intensity={isVictorian ? 0.18 : isClassicInterior ? 0.4 : 0.5}
        color={isClassicInterior ? "#f0d0a0" : "#e8eef8"}
        distance={radius * 2.2}
        decay={1.2}
      />

      {exploreMode ? (
        <group position={[0, 1.2, windowZ]}>
          <mesh position={[0, winH / 2 - frame / 2, 0]} material={wallMat}>
            <boxGeometry args={[winW, frame, 0.12]} />
          </mesh>
          <mesh position={[0, -winH / 2 + frame / 2, 0]} material={wallMat}>
            <boxGeometry args={[winW, frame, 0.12]} />
          </mesh>
          <mesh position={[-winW / 2 + frame / 2, 0, 0]} material={wallMat}>
            <boxGeometry args={[frame, winH, 0.12]} />
          </mesh>
          <mesh position={[winW / 2 - frame / 2, 0, 0]} material={wallMat}>
            <boxGeometry args={[frame, winH, 0.12]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

export default DeskRoom;
