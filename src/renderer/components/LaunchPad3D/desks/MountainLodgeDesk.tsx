import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

function hash2(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return (
    a * (1 - ux) * (1 - uy) +
    b * ux * (1 - uy) +
    c * (1 - ux) * uy +
    d * ux * uy
  );
}

function fbm(x: number, y: number, octaves = 5) {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.05;
  }
  return v;
}

/** Pine end-grain / face grain for the live-edge top. */
function makePineTextures(size = 512): {
  map: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
} {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rctx = roughCanvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);

  const light = { r: 198, g: 168, b: 118 };
  const mid = { r: 158, g: 122, b: 78 };
  const dark = { r: 110, g: 78, b: 48 };
  const knot = { r: 72, g: 48, b: 28 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      // Grain runs along Y (desk depth when mapped)
      const warp = fbm(nx * 3.5, ny * 0.8) * 0.35;
      const grain =
        Math.sin((nx * 28 + warp * 8 + fbm(nx * 2, ny * 4) * 2) * Math.PI) *
          0.5 +
        0.5;
      const early = fbm(nx * 12, ny * 2.2);
      const late = fbm(nx * 40 + 2, ny * 6);
      let t = grain * 0.55 + early * 0.3 + late * 0.15;
      t = Math.min(1, Math.max(0, t));

      let r = mid.r + (light.r - mid.r) * t;
      let g = mid.g + (light.g - mid.g) * t;
      let b = mid.b + (light.b - mid.b) * t;
      if (t < 0.28) {
        const k = (0.28 - t) / 0.28;
        r = r * (1 - k) + dark.r * k;
        g = g * (1 - k) + dark.g * k;
        b = b * (1 - k) + dark.b * k;
      }

      // Occasional knots
      const kx = hash2(Math.floor(nx * 7), Math.floor(ny * 5));
      const ky = hash2(Math.floor(ny * 5) + 3, Math.floor(nx * 7));
      const dist = Math.hypot(nx - (kx * 0.7 + 0.15), ny - (ky * 0.7 + 0.15));
      if (dist < 0.045) {
        const k = 1 - dist / 0.045;
        r = r * (1 - k) + knot.r * k;
        g = g * (1 - k) + knot.g * k;
        b = b * (1 - k) + knot.b * k;
      }

      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;

      const rv = Math.min(
        255,
        Math.max(70, (0.5 + grain * 0.25 + late * 0.2) * 255)
      );
      rimg.data[i] = rv;
      rimg.data[i + 1] = rv;
      rimg.data[i + 2] = rv;
      rimg.data[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rimg, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.2, 3.4);
  map.anisotropy = 8;
  map.needsUpdate = true;

  const rough = new THREE.CanvasTexture(roughCanvas);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(2.2, 3.4);
  rough.needsUpdate = true;

  return { map, rough };
}

/** Rough bark for log legs. */
function makeBarkTextures(size = 256): {
  map: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
} {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rctx = roughCanvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);

  const c0 = { r: 72, g: 52, b: 36 };
  const c1 = { r: 110, g: 82, b: 54 };
  const c2 = { r: 48, g: 34, b: 24 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const ridges = Math.abs(
        Math.sin((nx * 18 + fbm(nx * 4, ny * 2) * 3) * Math.PI)
      );
      const n = fbm(nx * 8, ny * 10);
      let t = ridges * 0.55 + n * 0.45;
      let r = c0.r + (c1.r - c0.r) * t;
      let g = c0.g + (c1.g - c0.g) * t;
      let b = c0.b + (c1.b - c0.b) * t;
      if (ridges > 0.85) {
        r = r * 0.7 + c2.r * 0.3;
        g = g * 0.7 + c2.g * 0.3;
        b = b * 0.7 + c2.b * 0.3;
      }
      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
      const rv = Math.min(255, Math.max(100, (0.7 + ridges * 0.25) * 255));
      rimg.data[i] = rv;
      rimg.data[i + 1] = rv;
      rimg.data[i + 2] = rv;
      rimg.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rimg, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1.5, 3);
  map.needsUpdate = true;
  const rough = new THREE.CanvasTexture(roughCanvas);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(1.5, 3);
  rough.needsUpdate = true;
  return { map, rough };
}

/**
 * Live-edge footprint: mostly rectangular, organic wavy long edges.
 */
function makeLiveEdgeShape(
  halfW: number,
  halfD: number,
  seed: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const edgeSamples = 36;

  // Walk CCW: front edge → right live edge → back → left live edge
  const push = (x: number, z: number, first: boolean) => {
    if (first) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  };

  // Front (near seat, −Z in shape space before rotate) — slightly uneven
  for (let i = 0; i <= edgeSamples; i++) {
    const t = i / edgeSamples;
    const x = -halfW + t * halfW * 2;
    const zig =
      (fbm(t * 4 + seed, seed) - 0.5) * halfD * 0.04 +
      Math.sin(t * Math.PI * 3 + seed) * halfD * 0.015;
    push(x, -halfD + zig, i === 0);
  }
  // Right live edge (+X) — strong organic curve
  for (let i = 1; i <= edgeSamples; i++) {
    const t = i / edgeSamples;
    const z = -halfD + t * halfD * 2;
    const live =
      0.88 +
      0.1 * Math.sin(t * Math.PI * 2.2 + seed) +
      0.08 * Math.sin(t * Math.PI * 5.1 - seed) +
      0.06 * (fbm(t * 5 + seed, 1.3) - 0.5);
    push(halfW * Math.min(1.02, Math.max(0.72, live)), z, false);
  }
  // Back edge
  for (let i = 1; i <= edgeSamples; i++) {
    const t = i / edgeSamples;
    const x = halfW - t * halfW * 2;
    const zig =
      (fbm(t * 4 - seed, seed + 2) - 0.5) * halfD * 0.035 +
      Math.sin(t * Math.PI * 2.5 - seed) * halfD * 0.012;
    push(x, halfD + zig, false);
  }
  // Left live edge (−X)
  for (let i = 1; i < edgeSamples; i++) {
    const t = i / edgeSamples;
    const z = halfD - t * halfD * 2;
    const live =
      0.86 +
      0.11 * Math.sin(t * Math.PI * 2.6 - seed * 1.2) +
      0.07 * Math.cos(t * Math.PI * 4.4 + seed) +
      0.07 * (fbm(t * 5 - seed, 2.1) - 0.5);
    push(-halfW * Math.min(1.02, Math.max(0.7, live)), z, false);
  }

  shape.closePath();
  return shape;
}

function makeLiveEdgeSlabGeometry(
  width: number,
  depth: number,
  height: number,
  seed: number
): THREE.BufferGeometry {
  const shape = makeLiveEdgeShape(width / 2, depth / 2, seed);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.18,
    bevelSize: Math.min(width, depth) * 0.012,
    bevelSegments: 2,
    curveSegments: 20,
    steps: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const midX = (bb.min.x + bb.max.x) * 0.5;
  const midZ = (bb.min.z + bb.max.z) * 0.5;
  geo.translate(-midX, -bb.max.y + height * 0.5, -midZ);

  // Soft surface undulation on top; stronger on live edges
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 0.4 + seed, v.z * 0.35);
    const edgeX = Math.abs(v.x) / (width * 0.5);
    const liveAmp = Math.max(0, edgeX - 0.65) * 0.08;
    const topFade = THREE.MathUtils.smoothstep(
      v.y,
      -height * 0.05,
      height * 0.35
    );
    v.y += (n - 0.5) * height * (0.04 + liveAmp) * (1 - topFade * 0.5);
    v.x += (n - 0.5) * liveAmp * width * 0.03;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Natural log leg — tapered, bark-bumped cylinder. */
function makeLogLegGeometry(
  radius: number,
  height: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(
    radius * 0.82,
    radius * 1.08,
    height,
    14,
    6,
    false
  );
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ang = Math.atan2(v.z, v.x);
    const y01 = (v.y + height * 0.5) / height;
    const n = fbm(ang * 1.2 + seed, y01 * 3.5);
    const n2 = fbm(ang * 3.1 - seed, y01 * 6);
    const bulge = 1 + (n - 0.5) * 0.18 + (n2 - 0.5) * 0.08;
    // Slight bend (natural trunk lean)
    const bend = Math.sin(y01 * Math.PI) * 0.04 * Math.sin(seed);
    v.x = v.x * bulge + bend * height;
    v.z *= bulge * (0.92 + 0.1 * Math.sin(seed * 1.7 + y01 * 2));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Mountain lodge desk — live-edge pine slab + organic bark log legs.
 */
export default function MountainLodgeDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

  const pineTex = useMemo(() => makePineTextures(512), []);
  const barkTex = useMemo(() => makeBarkTextures(256), []);

  const pine = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pineTex.map,
        roughnessMap: pineTex.rough,
        color: "#f0e0c4",
        metalness: 0.02,
        roughness: 0.78,
        envMapIntensity: 0.35,
      }),
    [pineTex]
  );
  const bark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: barkTex.map,
        roughnessMap: barkTex.rough,
        color: "#d4b896",
        metalness: 0.02,
        roughness: 0.92,
        envMapIntensity: 0.2,
      }),
    [barkTex]
  );

  const slabH = topThick * 1.25;
  const legH = supportHeight(layout, slabH);
  const topW = deskW * 0.97;
  const topD = deskDepth * 0.96;
  const endZs = [legZs[0], legZs[legZs.length - 1]];

  const slabGeo = useMemo(
    () => makeLiveEdgeSlabGeometry(topW, topD, slabH, 3.41),
    [topW, topD, slabH]
  );
  const logGeos = useMemo(
    () =>
      endZs.map((_, i) =>
        ([-1, 1] as number[]).map((side, j) =>
          makeLogLegGeometry(0.1 + i * 0.012 + j * 0.008, legH, 5.5 + i * 2 + j)
        )
      ),
    [endZs, legH]
  );

  useEffect(() => {
    return () => {
      pineTex.map.dispose();
      pineTex.rough.dispose();
      barkTex.map.dispose();
      barkTex.rough.dispose();
      pine.dispose();
      bark.dispose();
      slabGeo.dispose();
      logGeos.flat().forEach((g) => g.dispose());
    };
  }, [pineTex, barkTex, pine, bark, slabGeo, logGeos]);

  return (
    <group>
      <mesh
        geometry={slabGeo}
        material={pine}
        position={[0, topY - slabH / 2, deskCenterZ]}
        castShadow
        receiveShadow
      />

      {endZs.flatMap((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <mesh
            key={`${i}-${j}`}
            geometry={logGeos[i][j]}
            material={bark}
            position={[
              lx * (0.94 + j * 0.02),
              topY - slabH - legH / 2 + 0.04,
              lz + (j === 0 ? -0.03 : 0.04),
            ]}
            rotation={[
              0.03 * (j === 0 ? -1 : 1),
              (i * 1.1 + j * 0.8) * 0.4,
              0.04 * (i === 0 ? 1 : -1),
            ]}
            castShadow
          />
        ))
      )}
    </group>
  );
}
