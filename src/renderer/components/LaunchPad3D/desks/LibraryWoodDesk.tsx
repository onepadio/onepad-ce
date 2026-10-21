import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

function hash2(x: number, y: number) {
  const n = Math.sin(x * 91.3 + y * 171.7) * 43758.5453;
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

function fbm(x: number, y: number, octaves = 4) {
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

/**
 * Muted antique walnut matching the Sketchfab hall pillars/shelves —
 * low saturation, cool-dark brown (not orange lacquer).
 */
function makeLibraryWoodTextures(size = 512): {
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

  // Sampled toward hall wood: deep muted brown, little red/orange
  const light = { r: 92, g: 68, b: 52 };
  const mid = { r: 62, g: 44, b: 34 };
  const dark = { r: 38, g: 28, b: 22 };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const warp = fbm(nx * 1.4, ny * 0.5) * 0.18;
      const grain =
        Math.sin((nx * 10 + warp * 3 + fbm(nx * 0.6, ny * 1.6) * 0.6) * Math.PI) *
          0.5 +
        0.5;
      const pore = fbm(nx * 16, ny * 4.5);
      let t = grain * 0.4 + pore * 0.6;
      t = Math.min(1, Math.max(0, t));
      const r = mid.r + (light.r - mid.r) * t + (dark.r - mid.r) * (1 - t) * 0.45;
      const g = mid.g + (light.g - mid.g) * t + (dark.g - mid.g) * (1 - t) * 0.45;
      const b = mid.b + (light.b - mid.b) * t + (dark.b - mid.b) * (1 - t) * 0.45;
      const i = (y * size + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
      const rough = 205 + pore * 40;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = rough;
      rimg.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2.0, 2.0);
  const rough = new THREE.CanvasTexture(roughCanvas);
  rough.wrapS = rough.wrapT = THREE.RepeatWrapping;
  rough.repeat.set(2.0, 2.0);
  return { map, rough };
}

/**
 * Reading table tuned to the Sketchfab library wood — same family as
 * the dark hall paneling, not bright orange desk-stock.
 */
export default function LibraryWoodDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ } = layout;

  const tex = useMemo(() => makeLibraryWoodTextures(512), []);
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex.map,
        roughnessMap: tex.rough,
        // Near-neutral multiply so map carries the tone
        color: "#9a7a62",
        metalness: 0,
        roughness: 0.86,
        envMapIntensity: 0.12,
      }),
    [tex]
  );
  const woodDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex.map,
        roughnessMap: tex.rough,
        color: "#7a5e4a",
        metalness: 0,
        roughness: 0.88,
        envMapIntensity: 0.1,
      }),
    [tex]
  );
  const trim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5a4838",
        metalness: 0.15,
        roughness: 0.55,
        envMapIntensity: 0.2,
      }),
    []
  );

  useEffect(() => {
    return () => {
      tex.map.dispose();
      tex.rough.dispose();
      wood.dispose();
      woodDark.dispose();
      trim.dispose();
    };
  }, [tex, wood, woodDark, trim]);

  const slabH = Math.max(topThick * 1.1, 0.15);
  const apronH = 0.12;
  const moldingH = 0.045;
  const legH = supportHeight(layout, slabH + apronH + moldingH);
  const legR = tableRadius * 0.48;
  const legAngles = [0.35, Math.PI / 2 + 0.35, Math.PI + 0.35, (Math.PI * 3) / 2 + 0.35];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={wood}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[tableRadius, tableRadius, slabH, 64]} />
      </mesh>
      <mesh
        position={[0, topY - 0.008, deskCenterZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={trim}
      >
        <ringGeometry args={[tableRadius - 0.035, tableRadius - 0.008, 64]} />
      </mesh>
      <mesh
        position={[0, topY - slabH - moldingH / 2, deskCenterZ]}
        material={woodDark}
        castShadow
      >
        <cylinderGeometry
          args={[tableRadius * 0.97, tableRadius * 0.93, moldingH, 64]}
        />
      </mesh>
      <mesh
        position={[0, topY - slabH - moldingH - apronH / 2, deskCenterZ]}
        material={woodDark}
        castShadow
      >
        <cylinderGeometry
          args={[tableRadius * 0.91, tableRadius * 0.89, apronH, 64]}
        />
      </mesh>

      <mesh
        position={[
          0,
          topY - slabH - moldingH - apronH - legH * 0.32,
          deskCenterZ,
        ]}
        material={wood}
        castShadow
      >
        <cylinderGeometry
          args={[tableRadius * 0.14, tableRadius * 0.18, legH * 0.5, 24]}
        />
      </mesh>
      <mesh
        position={[
          0,
          topY - slabH - moldingH - apronH - legH * 0.7,
          deskCenterZ,
        ]}
        material={woodDark}
        castShadow
      >
        <cylinderGeometry
          args={[tableRadius * 0.2, tableRadius * 0.26, legH * 0.16, 24]}
        />
      </mesh>

      {legAngles.map((a, i) => {
        const x = Math.sin(a) * legR;
        const z = deskCenterZ - Math.cos(a) * legR;
        const yMid = topY - slabH - moldingH - apronH - legH / 2;
        return (
          <group key={i} position={[x, yMid, z]}>
            <mesh material={wood} castShadow>
              <cylinderGeometry args={[0.075, 0.095, legH * 0.75, 12]} />
            </mesh>
            <mesh position={[0, legH * 0.4, 0]} material={woodDark} castShadow>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
            <mesh position={[0, -legH * 0.44, 0]} material={woodDark} castShadow>
              <cylinderGeometry args={[0.12, 0.14, 0.08, 12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
