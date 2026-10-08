import { Suspense, useMemo, useEffect } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import {
  ARENA_FLOOR_Y,
  getArenaRadius,
  getSceneGrid,
} from "./layouts/roomScreens";

/** Equirectangular Milky Way (Solar System Scope, CC BY 4.0) */
import spaceDomeUrl from "../../images/space_dome_milkyway.jpg";

interface CircularArenaProps {
  count: number;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function makeFloorTexture(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#2a3a52";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Concentric rings
  for (let i = 1; i <= 10; i++) {
    const r = (size * 0.48 * i) / 10;
    ctx.strokeStyle =
      i % 2 === 0 ? "rgba(90,140,190,0.22)" : "rgba(60,90,130,0.14)";
    ctx.lineWidth = i === 5 ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Radial spokes
  ctx.strokeStyle = "rgba(100,150,200,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * size * 0.48, cy + Math.sin(a) * size * 0.48);
    ctx.stroke();
  }

  // Center pad
  const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.12);
  cg.addColorStop(0, "rgba(70,120,180,0.35)");
  cg.addColorStop(1, "rgba(30,45,70,0)");
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Outer walkway ring
  ctx.strokeStyle = "rgba(140,190,230,0.28)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeWallTexture(size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#3a4e66");
  bg.addColorStop(0.5, "#2e4058");
  bg.addColorStop(1, "#253448");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Horizontal panel bands
  const bands = 6;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * h;
    ctx.fillStyle =
      i % 2 === 0 ? "rgba(70,100,135,0.4)" : "rgba(40,58,82,0.28)";
    ctx.fillRect(0, y, w, h / bands);
    ctx.strokeStyle = "rgba(150,195,235,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Vertical panel seams (around circumference)
  const seams = 32;
  for (let i = 0; i < seams; i++) {
    const x = (i / seams) * w;
    ctx.strokeStyle = "rgba(120,165,210,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Soft tech dots
  const rnd = seeded(91);
  ctx.fillStyle = "rgba(140,200,255,0.12)";
  for (let i = 0; i < 80; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Circular arena with panelled floor/wall and a space-sky dome roof.
 */
function CircularArenaEnvironment({ count }: CircularArenaProps) {
  const n = Math.max(count, 1);
  const radius = getArenaRadius(n);
  const { rows } = getSceneGrid(n);
  // Tall enough for single-row large screens
  const wallHeight = Math.max(5.2, 3.6 + rows * 1.15);
  const wallTop = ARENA_FLOOR_Y + wallHeight + 0.15;
  const wallY = ARENA_FLOOR_Y + wallHeight / 2 + 0.15;
  // Hemisphere equator sits on the wall rim; apex opens the space sky above
  const domeY = wallTop;
  // Keep dome outside the recessed wall cylinder
  const domeRadius = Math.max(radius + 4.0, wallHeight * 0.95);

  const spaceMap = useTexture(spaceDomeUrl);
  useEffect(() => {
    spaceMap.colorSpace = THREE.SRGBColorSpace;
    spaceMap.anisotropy = 8;
    spaceMap.needsUpdate = true;
  }, [spaceMap]);

  const textures = useMemo(
    () => ({
      floor: makeFloorTexture(),
      wall: makeWallTexture(),
    }),
    []
  );

  useEffect(() => {
    return () => {
      textures.floor.dispose();
      textures.wall.dispose();
    };
  }, [textures]);

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textures.wall,
        color: "#e8f0fa",
        metalness: 0.2,
        roughness: 0.62,
        side: THREE.DoubleSide,
      }),
    [textures.wall]
  );
  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textures.floor,
        color: "#dce6f4",
        metalness: 0.25,
        roughness: 0.5,
      }),
    [textures.floor]
  );
  const domeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: spaceMap,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    [spaceMap]
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6a82a0",
        metalness: 0.45,
        roughness: 0.4,
      }),
    []
  );

  return (
    <group>
      {/* Observation floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ARENA_FLOOR_Y, 0]}
        material={floorMat}
        receiveShadow
      >
        <circleGeometry args={[radius + 1.8, 72]} />
      </mesh>

      {/* Raised center dais */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, ARENA_FLOOR_Y + 0.04, 0]}
        material={ringMat}
        receiveShadow
      >
        <ringGeometry args={[1.1, 1.45, 48]} />
      </mesh>

      {/*
        Wall sits well behind the screen ring so curvature is gentle in FOV.
        Close walls + cartesian camera lerp made the grid look like it was bending
        while turning.
      */}
      <mesh position={[0, wallY, 0]} material={wallMat} receiveShadow>
        <cylinderGeometry
          args={[radius + 3.2, radius + 3.2, wallHeight, 96, 1, true]}
        />
      </mesh>

      {/* Space dome roof — Milky Way equirectangular cover */}
      <mesh
        position={[0, domeY, 0]}
        rotation={[0, Math.PI * 0.35, 0]}
        material={domeMat}
      >
        <sphereGeometry
          args={[domeRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.52]}
        />
      </mesh>

      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#c8daf0", "#3a4a62", 0.95]} />

      {/* Soft zenith wash through the dome */}
      <directionalLight
        position={[0, domeY + domeRadius * 0.85, 0]}
        intensity={1.85}
        color="#f2f6ff"
      />
      <spotLight
        position={[0, domeY + domeRadius * 0.55, 0]}
        angle={1.2}
        penumbra={0.85}
        intensity={4.2}
        color="#ffffff"
        distance={radius * 5}
      />
      <pointLight
        position={[0, wallY + wallHeight * 0.35, 0]}
        intensity={2.2}
        color="#c4d8f0"
        distance={radius * 3.5}
        decay={1}
      />
      <pointLight
        position={[radius * 0.45, wallY, 0]}
        intensity={1.4}
        color="#dde8f8"
        distance={radius * 2.5}
        decay={1.1}
      />
      <pointLight
        position={[-radius * 0.45, wallY, 0]}
        intensity={1.4}
        color="#dde8f8"
        distance={radius * 2.5}
        decay={1.1}
      />
    </group>
  );
}

export default function ControlRoomEnvironment(props: CircularArenaProps) {
  return (
    <Suspense fallback={null}>
      <CircularArenaEnvironment {...props} />
    </Suspense>
  );
}
