import { Suspense, useMemo } from "react";
import * as THREE from "three";

import { EXPERIENCE_MODELS } from "../experiences/assetUrls";
import GltfProp from "../experiences/GltfProp";
import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/** Sleek circular office desk — dark laminate, chrome legs + metal desk prop. */
export default function OfficeModernDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ, floorY } = layout;

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
  const legR = tableRadius * 0.6;
  const legAngles = [0.4, Math.PI / 2 + 0.4, Math.PI + 0.4, (Math.PI * 3) / 2 + 0.4];

  return (
    <group>
      <mesh
        position={[0, topY - slabH / 2, deskCenterZ]}
        material={laminate}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[tableRadius, tableRadius, slabH, 48]} />
      </mesh>
      <mesh
        position={[0, topY - slabH - 0.015, deskCenterZ]}
        material={chrome}
      >
        <cylinderGeometry
          args={[tableRadius * 0.995, tableRadius * 0.995, 0.03, 48]}
        />
      </mesh>

      {legAngles.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(a) * legR,
            topY - slabH - legH / 2,
            deskCenterZ - Math.cos(a) * legR,
          ]}
          material={chrome}
          castShadow
        >
          <cylinderGeometry args={[0.035, 0.04, legH, 12]} />
        </mesh>
      ))}

      <Suspense fallback={null}>
        <GltfProp
          url={EXPERIENCE_MODELS.metalOfficeDesk}
          position={[1.55, floorY, 1.1]}
          rotation={[0, -0.85, 0]}
          fitTo={1.5}
          fitMode="width"
          sitOnGround
        />
      </Suspense>
    </group>
  );
}
