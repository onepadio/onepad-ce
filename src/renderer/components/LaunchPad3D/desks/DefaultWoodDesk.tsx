import { useMemo } from "react";
import * as THREE from "three";

import { supportHeight } from "./deskLayout";
import type { DeskTableProps } from "./types";

/** Circular wood desk top + ring of legs under the screen arena. */
export default function DefaultWoodDesk({ layout }: DeskTableProps) {
  const { tableRadius, topY, topThick, deskCenterZ } = layout;

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
    </group>
  );
}
