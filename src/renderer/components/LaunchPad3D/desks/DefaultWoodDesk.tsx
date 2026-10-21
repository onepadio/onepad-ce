import { Suspense, useMemo } from "react";
import * as THREE from "three";

import { EXPERIENCE_MODELS } from "../experiences/assetUrls";
import GltfProp from "../experiences/GltfProp";
import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/**
 * Circular wood desk — procedural top (monitor alignment) + Poly Haven
 * round table as a surface accent where the seat meets the wood.
 */
export default function DefaultWoodDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ, floorY } = layout;

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
  const legR = tableRadius * 0.62;
  const legAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

  return (
    <group>
      <mesh
        position={[0, topY - topThick / 2, deskCenterZ]}
        material={wood}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[tableRadius, tableRadius, topThick, 48]} />
      </mesh>
      {legAngles.map((a, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(a) * legR,
            topY - topThick - legH / 2,
            deskCenterZ - Math.cos(a) * legR,
          ]}
          material={wood}
        >
          <cylinderGeometry args={[0.06, 0.07, legH, 8]} />
        </mesh>
      ))}

      <Suspense fallback={null}>
        {/* Realistic coffee-table scale prop near the seat */}
        <GltfProp
          url={EXPERIENCE_MODELS.roundWoodenTable}
          position={[0, floorY, 1.35]}
          rotation={[0, 0.25, 0]}
          fitTo={1.35}
          fitMode="width"
          sitOnGround
        />
      </Suspense>
    </group>
  );
}
