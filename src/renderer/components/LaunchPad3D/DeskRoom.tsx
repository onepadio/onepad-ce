import { useMemo } from "react";
import * as THREE from "three";

import { getDeskLayout, getDeskTable } from "./desks";
import {
  ARENA_FLOOR_Y,
  DESK_FRAME_RADIUS,
  SCENE_SCREEN_H,
  SCENE_SCREEN_W,
  SCENE_SCREEN_Y,
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
};

/**
 * Fixed first-person desk shell: floor, monitor frame, lights, explore window.
 * Table mesh/material comes from the active experience (shared bounding box).
 */
function DeskRoom({
  count,
  exploreMode = false,
  experienceId = null,
}: DeskRoomProps) {
  const layout = useMemo(() => getDeskLayout(count), [count]);
  const {
    radius,
    frontZ,
    camZ,
    deskDepth,
    topY,
    deskCenterZ,
  } = layout;

  const DeskTable = useMemo(
    () => getDeskTable(experienceId),
    [experienceId]
  );

  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a4558",
        metalness: 0.15,
        roughness: 0.78,
      }),
    []
  );
  const bezelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5a6a7c",
        metalness: 0.4,
        roughness: 0.45,
      }),
    []
  );
  const frameMetrics = useMemo(() => {
    const scale =
      Math.min(SCENE_SCREEN_W / 2.4, SCENE_SCREEN_H / 1.5) * 0.98;
    const contentW = 2.4 * 1.08 * scale;
    const contentH = 1.5 * scale;
    const border = 0.14;
    const gap = 0.03;
    const outerW = contentW + border * 2;
    const outerH = contentH + border * 2;
    return {
      outerW,
      outerH,
      frameBottomY: SCENE_SCREEN_Y - outerH / 2,
      geo: makeRoundedFrameGeometry(
        outerW,
        outerH,
        contentW + gap,
        contentH + gap,
        DESK_FRAME_RADIUS,
        0.1
      ),
    };
  }, []);
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a5568",
        metalness: 0.08,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
    []
  );
  const standMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a5668",
        metalness: 0.55,
        roughness: 0.38,
      }),
    []
  );

  const winW = DESK_ROOM.windowSize[0];
  const winH = DESK_ROOM.windowSize[1];
  const frame = 0.22;
  const windowZ = Math.max(camZ + 2.5, radius * 0.45 + 2);

  // Monitor stand: neck from desk top up into the frame bottom
  const standZ = frontZ + 0.1;
  const frameBottomY = frameMetrics.frameBottomY;
  const neckTopY = frameBottomY + 0.04;
  const neckBottomY = topY + 0.02;
  const neckH = Math.max(0.2, neckTopY - neckBottomY);
  const neckMidY = (neckTopY + neckBottomY) * 0.5;

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ARENA_FLOOR_Y, 0]}
        material={floorMat}
        receiveShadow
      >
        <circleGeometry args={[radius + 2.5, 64]} />
      </mesh>

      <DeskTable layout={layout} />

      {/* Rounded monitor frame + stand connected to desk */}
      <group position={[0, SCENE_SCREEN_Y, frontZ]}>
        <mesh
          position={[0, 0, -0.12]}
          geometry={frameMetrics.geo}
          material={bezelMat}
          castShadow
        />
      </group>
      {/* Arm / neck */}
      <mesh
        position={[0, neckMidY, standZ]}
        material={standMat}
        castShadow
      >
        <boxGeometry args={[0.14, neckH, 0.08]} />
      </mesh>
      {/* Joint under the bezel */}
      <mesh
        position={[0, frameBottomY + 0.02, standZ]}
        material={standMat}
        castShadow
      >
        <boxGeometry args={[0.28, 0.07, 0.1]} />
      </mesh>
      {/* Foot plate sitting on the desk */}
      <mesh
        position={[0, topY + 0.025, standZ + 0.08]}
        material={standMat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.55, 0.05, 0.32]} />
      </mesh>

      <pointLight
        position={[0, topY + 0.25, deskCenterZ + deskDepth * 0.1]}
        intensity={0.5}
        color="#ffe8c8"
        distance={5.5}
        decay={2}
      />
      <pointLight
        position={[0, ARENA_FLOOR_Y + 3.2, 0]}
        intensity={0.5}
        color="#e8eef8"
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
