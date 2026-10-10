import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/**
 * Sleek office desk — thin dark laminate, chrome legs, soft rounded top.
 */
export default function OfficeModernDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

  const laminate = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2c3340",
        metalness: 0.18,
        roughness: 0.42,
      }),
    []
  );
  const chrome = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c8d0da",
        metalness: 0.85,
        roughness: 0.22,
      }),
    []
  );

  const slabH = topThick * 0.75;
  const legH = supportHeight(layout, slabH);
  const endZs = [legZs[0], legZs[legZs.length - 1]];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={laminate}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deskW, slabH, deskDepth]} />
      </mesh>
      <mesh
        position={[0, topY - slabH - 0.015, deskCenterZ]}
        material={chrome}
      >
        <boxGeometry args={[deskW * 0.995, 0.03, deskDepth * 0.995]} />
      </mesh>

      {endZs.flatMap((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <mesh
            key={`${i}-${j}`}
            position={[lx, topY - slabH - legH / 2, lz]}
            material={chrome}
            castShadow
          >
            <cylinderGeometry args={[0.035, 0.04, legH, 12]} />
          </mesh>
        ))
      )}
    </group>
  );
}
