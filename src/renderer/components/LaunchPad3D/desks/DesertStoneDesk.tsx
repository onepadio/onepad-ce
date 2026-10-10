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

function makeSandstoneTextures(size = 512): {
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

  const c0 = { r: 176, g: 142, b: 98 };
  const c1 = { r: 210, g: 180, b: 132 };
  const c2 = { r: 140, g: 108, b: 72 };
  const vein = { r: 120, g: 95, b: 68 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const n = fbm(nx * 6.5, ny * 6.5);
      const n2 = fbm(nx * 18 + 3.1, ny * 18 - 1.7);
      const strata = Math.sin((ny * 14 + n * 2.2) * Math.PI) * 0.5 + 0.5;
      const speck = hash2(x * 0.37, y * 0.61);

      let t = Math.min(1, Math.max(0, n * 0.55 + strata * 0.25 + n2 * 0.2));
      let r = c0.r + (c1.r - c0.r) * t;
      let g = c0.g + (c1.g - c0.g) * t;
      let b = c0.b + (c1.b - c0.b) * t;

      const v = Math.abs(fbm(nx * 3.2, ny * 9.5) - 0.5);
      if (v < 0.06) {
        const k = 1 - v / 0.06;
        r = r * (1 - k * 0.35) + vein.r * k * 0.35;
        g = g * (1 - k * 0.35) + vein.g * k * 0.35;
        b = b * (1 - k * 0.35) + vein.b * k * 0.35;
      }
      if (speck > 0.92) {
        r = r * 0.85 + c2.r * 0.15;
        g = g * 0.85 + c2.g * 0.15;
        b = b * 0.85 + c2.b * 0.15;
      }

      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;

      const roughV = 0.55 + n * 0.28 + n2 * 0.12 - (speck > 0.9 ? 0.08 : 0);
      const rv = Math.min(255, Math.max(80, roughV * 255));
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
  map.repeat.set(1.6, 2.1);
  map.anisotropy = 8;
  map.needsUpdate = true;

  const rough = new THREE.CanvasTexture(roughCanvas);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(1.6, 2.1);
  rough.needsUpdate = true;

  return { map, rough };
}

/**
 * Irregular natural stone footprint — noisy oval kept inside the desk bounds.
 */
function makeIrregularStoneShape(
  halfW: number,
  halfD: number,
  seed: number,
  segments = 48
): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const nx = Math.cos(t);
    const ny = Math.sin(t);
    // Multi-lobe radius so silhouette isn't a smooth ellipse
    const wobble =
      0.78 +
      0.14 * Math.sin(t * 2 + seed) +
      0.1 * Math.sin(t * 3 - seed * 1.3) +
      0.08 * Math.cos(t * 5 + seed * 0.7) +
      0.06 * (fbm(nx * 2.4 + seed, ny * 2.4 - seed) - 0.5);
    const r = Math.min(1.02, Math.max(0.62, wobble));
    // Soften corners toward a natural boulder — slightly flatter long sides
    const squash = 0.92 + 0.08 * Math.abs(Math.cos(t * 2));
    const x = nx * halfW * r * squash;
    const y = ny * halfD * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Extruded irregular slab with noisy top surface (natural rock).
 * Top face stays near y = height/2 so desk topY alignment holds.
 */
function makeIrregularStoneGeometry(
  width: number,
  depth: number,
  height: number,
  seed: number
): THREE.BufferGeometry {
  const shape = makeIrregularStoneShape(width / 2, depth / 2, seed, 56);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.22,
    bevelSize: Math.min(width, depth) * 0.035,
    bevelSegments: 3,
    curveSegments: 28,
    steps: 1,
  });
  // Extrude along +Z → rotate so slab sits in XZ with thickness on Y
  geo.rotateX(-Math.PI / 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  // Center XZ; put top face at +height/2 locally
  const midX = (bb.min.x + bb.max.x) * 0.5;
  const midZ = (bb.min.z + bb.max.z) * 0.5;
  const topY = bb.max.y;
  geo.translate(-midX, -topY + height * 0.5, -midZ);

  // Displace surface for organic facets (keep top mostly flat for usability)
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 0.55 + seed, v.z * 0.55 - seed);
    const edge =
      Math.max(Math.abs(v.x) / (width * 0.5), Math.abs(v.z) / (depth * 0.5));
    const edgeBoost = Math.max(0, edge - 0.55) * 0.12;
    // Sides and underside get more roughness; top stays flatter
    const topFade = THREE.MathUtils.smoothstep(v.y, -height * 0.1, height * 0.35);
    const amp = (0.04 + edgeBoost) * (1 - topFade * 0.75);
    v.x += (n - 0.5) * amp * width * 0.04;
    v.z += (fbm(v.z * 0.7, v.x * 0.7 + 2) - 0.5) * amp * depth * 0.04;
    v.y += (n - 0.45) * amp * height * (0.35 + edgeBoost * 4);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Irregular rock pier (squashed noisy icosahedron). */
function makeRockPierGeometry(
  radius: number,
  height: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = fbm(v.x * 2.2 + seed, v.y * 2.2 - seed);
    const n2 = fbm(v.z * 2.5 + 1.3, v.x * 1.8);
    const r = 0.78 + n * 0.28 + n2 * 0.12;
    v.multiplyScalar(r);
    // Stretch into a pier: wider mid, pinched ends
    const y01 = (v.y + 1) * 0.5;
    const bulge = 0.85 + 0.25 * Math.sin(y01 * Math.PI);
    v.x *= bulge;
    v.z *= bulge * (0.9 + 0.15 * Math.sin(seed + y01 * 4));
    v.y *= height * 0.5;
    v.x *= radius;
    v.z *= radius * (0.85 + 0.2 * hash2(seed, i * 0.1));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Natural irregular sandstone desk — boulder slab + rock piers.
 * Kept inside the shared desk bounding box (top face ≈ topY).
 */
export default function DesertStoneDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

  const textures = useMemo(() => makeSandstoneTextures(512), []);

  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textures.map,
        roughnessMap: textures.rough,
        color: "#e8d4b0",
        metalness: 0.02,
        roughness: 0.9,
        envMapIntensity: 0.3,
      }),
    [textures]
  );
  const darker = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: textures.map,
        roughnessMap: textures.rough,
        color: "#c4a57a",
        metalness: 0.02,
        roughness: 0.94,
        envMapIntensity: 0.25,
      }),
    [textures]
  );

  const slabH = topThick * 1.35;
  const legH = supportHeight(layout, slabH * 0.85);
  const topW = deskW * 0.96;
  const topD = deskDepth * 0.94;

  const slabGeo = useMemo(
    () => makeIrregularStoneGeometry(topW, topD, slabH, 2.17),
    [topW, topD, slabH]
  );
  const pierGeos = useMemo(
    () =>
      legZs.map((_, i) =>
        ([-1, 1] as number[]).map((side, j) =>
          makeRockPierGeometry(0.16 + (i + j) * 0.012, legH, 4.2 + i * 1.7 + j)
        )
      ),
    [legZs, legH]
  );

  useEffect(() => {
    return () => {
      textures.map.dispose();
      textures.rough.dispose();
      stone.dispose();
      darker.dispose();
      slabGeo.dispose();
      pierGeos.flat().forEach((g) => g.dispose());
    };
  }, [textures, stone, darker, slabGeo, pierGeos]);

  return (
    <group>
      <mesh
        geometry={slabGeo}
        material={stone}
        // Geometry top ≈ +slabH/2 → world top sits at topY
        position={[0, topY - slabH / 2, deskCenterZ]}
        castShadow
        receiveShadow
      />

      {legZs.map((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <mesh
            key={`${i}-${j}`}
            geometry={pierGeos[i][j]}
            material={darker}
            position={[
              lx * (0.92 + (i % 2) * 0.04),
              topY - slabH - legH / 2 + 0.06,
              lz + (j === 0 ? -0.04 : 0.05) * (i % 2 === 0 ? 1 : -1),
            ]}
            rotation={[
              0.04 * (j === 0 ? -1 : 1),
              (i * 0.7 + j) * 0.35,
              0.05 * (i % 2 === 0 ? 1 : -1),
            ]}
            castShadow
          />
        ))
      )}
    </group>
  );
}
