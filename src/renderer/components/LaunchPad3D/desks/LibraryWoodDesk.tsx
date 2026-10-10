import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/**
 * Library study table — warm mahogany top with apron rail and stout legs.
 */
export default function LibraryWoodDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

  const mahogany = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6b3e2e",
        metalness: 0.05,
        roughness: 0.62,
      }),
    []
  );
  const darker = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a2a1e",
        metalness: 0.04,
        roughness: 0.7,
      }),
    []
  );

  const slabH = topThick * 1.05;
  const apronH = 0.1;
  const legH = supportHeight(layout, slabH + apronH);
  const endZs = [legZs[0], legZs[legZs.length - 1]];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={mahogany}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deskW, slabH, deskDepth]} />
      </mesh>
      <mesh
        position={[0, topY - slabH - apronH / 2, deskCenterZ]}
        material={darker}
        castShadow
      >
        <boxGeometry args={[deskW * 0.94, apronH, deskDepth * 0.92]} />
      </mesh>

      {endZs.flatMap((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <group
            key={`${i}-${j}`}
            position={[lx, topY - slabH - apronH - legH / 2, lz]}
          >
            <mesh material={mahogany} castShadow>
              <boxGeometry args={[0.12, legH, 0.12]} />
            </mesh>
            <mesh position={[0, legH * 0.08, 0]} material={darker}>
              <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}
