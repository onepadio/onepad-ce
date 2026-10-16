import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/** Circular library study table — warm mahogany with apron ring. */
export default function LibraryWoodDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ } = layout;

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
  const legR = tableRadius * 0.58;
  const legAngles = [0.3, Math.PI / 2 + 0.3, Math.PI + 0.3, (Math.PI * 3) / 2 + 0.3];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={mahogany}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[tableRadius, tableRadius, slabH, 48]} />
      </mesh>
      <mesh
        position={[0, topY - slabH - apronH / 2, deskCenterZ]}
        material={darker}
        castShadow
      >
        <cylinderGeometry
          args={[tableRadius * 0.94, tableRadius * 0.94, apronH, 48]}
        />
      </mesh>

      {legAngles.map((a, i) => (
        <group
          key={i}
          position={[
            Math.sin(a) * legR,
            topY - slabH - apronH - legH / 2,
            deskCenterZ - Math.cos(a) * legR,
          ]}
        >
          <mesh material={mahogany} castShadow>
            <boxGeometry args={[0.12, legH, 0.12]} />
          </mesh>
          <mesh position={[0, legH * 0.08, 0]} material={darker}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
