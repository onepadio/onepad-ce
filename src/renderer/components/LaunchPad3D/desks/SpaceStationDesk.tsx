import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/** Circular orbital console — brushed metal top, panel legs. */
export default function SpaceStationDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ } = layout;

  const hull = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a4558",
        metalness: 0.72,
        roughness: 0.35,
      }),
    []
  );
  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5ec8ff",
        metalness: 0.4,
        roughness: 0.3,
        emissive: "#1a6088",
        emissiveIntensity: 0.45,
      }),
    []
  );
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a2230",
        metalness: 0.55,
        roughness: 0.4,
      }),
    []
  );

  const slabH = topThick;
  const legH = supportHeight(layout, slabH);
  const legR = tableRadius * 0.6;
  const legAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={hull}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[tableRadius, tableRadius, slabH, 48]} />
      </mesh>
      <mesh
        position={[0, topY - 0.01, deskCenterZ]}
        material={accent}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[tableRadius * 0.55, tableRadius * 0.62, 48]} />
      </mesh>

      {legAngles.map((a, i) => (
        <group
          key={i}
          position={[
            Math.sin(a) * legR,
            topY - slabH - legH / 2,
            deskCenterZ - Math.cos(a) * legR,
          ]}
        >
          <mesh material={dark} castShadow>
            <boxGeometry args={[0.12, legH, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} material={hull}>
            <boxGeometry args={[0.06, legH * 0.92, 0.02]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}