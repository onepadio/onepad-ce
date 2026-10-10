import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/** Fallback rectangular wood desk (classic warm top + square legs). */
export default function DefaultWoodDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#7a5c48",
        metalness: 0.06,
        roughness: 0.68,
      }),
    []
  );

  const legH = supportHeight(layout, topThick);

  return (
    <group>
      <mesh
        position={[0, topY - topThick / 2, deskCenterZ]}
        material={wood}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deskW, topThick, deskDepth]} />
      </mesh>
      {legZs.flatMap((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <mesh
            key={`${i}-${j}`}
            position={[lx, topY - topThick - legH / 2, lz]}
            material={wood}
          >
            <boxGeometry args={[0.1, legH, 0.1]} />
          </mesh>
        ))
      )}
    </group>
  );
}