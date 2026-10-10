import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/**
 * Orbital console — brushed metal top with chamfered corners, panel legs.
 */
export default function SpaceStationDesk({ layout }: DeskTableProps) {
  const { deskW, deskDepth, topY, topThick, deskCenterZ, legInsetX, legZs } =
    layout;

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
  const inset = deskW * 0.06;

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={hull}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deskW - inset * 2, slabH, deskDepth]} />
      </mesh>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={hull}
        castShadow
      >
        <boxGeometry args={[deskW, slabH, deskDepth - inset * 2]} />
      </mesh>
      <mesh
        position={[0, topY - 0.01, deskCenterZ - deskDepth / 2 + 0.04]}
        material={accent}
      >
        <boxGeometry args={[deskW * 0.7, 0.02, 0.03]} />
      </mesh>

      {legZs.map((lz, i) =>
        ([-legInsetX, legInsetX] as number[]).map((lx, j) => (
          <group key={`${i}-${j}`} position={[lx, topY - slabH - legH / 2, lz]}>
            <mesh material={dark} castShadow>
              <boxGeometry args={[0.12, legH, 0.08]} />
            </mesh>
            <mesh position={[0, 0, 0.05]} material={hull}>
              <boxGeometry args={[0.06, legH * 0.92, 0.02]} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}
