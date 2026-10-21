import { useMemo } from "react";
import * as THREE from "three";

import { EXPERIENCE_MODELS } from "./assetUrls";
import GltfProp from "./GltfProp";

const SPINE_COLORS = [
  "#3a2218",
  "#5c2e1e",
  "#2a3a48",
  "#4a3020",
  "#6b4428",
  "#1e2a38",
  "#5a1e1e",
  "#3d4a2a",
  "#4a2850",
  "#2e2418",
  "#704828",
  "#243040",
];

/** Shelf board heights as fractions of the fitted bookshelf height */
const SHELF_FRACTIONS = [0.12, 0.3, 0.48, 0.66, 0.84];

type FilledBookshelfProps = {
  position: [number, number, number];
  rotationY?: number;
  /** Target height of the worn bookshelf */
  fitTo?: number;
  /** Place a real encyclopedia set on the middle shelf */
  heroBook?: boolean;
  seed?: number;
};

/**
 * Worn Poly Haven bookshelf filled with procedural leather spines
 * so the hall reads as a library instead of empty furniture.
 */
export default function FilledBookshelf({
  position,
  rotationY = 0,
  fitTo = 3.05,
  heroBook = false,
  seed = 1,
}: FilledBookshelfProps) {
  const shelfWidth = fitTo * 0.42;
  const shelfDepth = fitTo * 0.14;

  const books = useMemo(() => {
    const items: {
      x: number;
      y: number;
      z: number;
      w: number;
      h: number;
      d: number;
      color: string;
    }[] = [];
    let s = seed * 9973;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    SHELF_FRACTIONS.forEach((frac, row) => {
      const y = fitTo * frac + 0.02;
      let x = -shelfWidth * 0.46;
      const end = shelfWidth * 0.46;
      let i = 0;
      while (x < end - 0.04) {
        const w = 0.028 + rand() * 0.055;
        const h = 0.18 + rand() * 0.16;
        const d = shelfDepth * (0.55 + rand() * 0.35);
        items.push({
          x: x + w * 0.5,
          y: y + h * 0.5,
          z: -shelfDepth * 0.05 + (rand() - 0.5) * 0.02,
          w,
          h,
          d,
          color: SPINE_COLORS[(row * 7 + i + seed) % SPINE_COLORS.length],
        });
        x += w + 0.004 + rand() * 0.012;
        i += 1;
        if (i > 48) break;
      }
    });
    return items;
  }, [fitTo, seed, shelfDepth, shelfWidth]);

  const mats = useMemo(() => {
    const cache = new Map<string, THREE.MeshStandardMaterial>();
    return (color: string) => {
      let m = cache.get(color);
      if (!m) {
        m = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.72,
          metalness: 0.08,
        });
        cache.set(color, m);
      }
      return m;
    };
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <GltfProp
        url={EXPERIENCE_MODELS.woodenBookshelfWorn}
        position={[0, 0, 0]}
        fitTo={fitTo}
        fitMode="height"
        sitOnGround
      />
      {books.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.y, b.z]}
          material={mats(b.color)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
      {heroBook ? (
        <GltfProp
          url={EXPERIENCE_MODELS.bookEncyclopedia}
          position={[0, fitTo * 0.48 + 0.08, shelfDepth * 0.15]}
          rotation={[0, 0, 0]}
          fitTo={shelfWidth * 0.92}
          fitMode="width"
        />
      ) : null}
    </group>
  );
}
