import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ARENA_FLOOR_Y, getDeskArenaRadius } from "../layouts/roomScreens";
import ExperienceEnvironment from "./ExperienceEnvironment";
import VictorianStudyInterior from "./VictorianStudyInterior";
import type { ExperienceVistaProps } from "./types";

/**
 * Victorian Study — warm fireplace study with antique desk, bookshelves,
 * and the circular OnePad desk seated in the center of the room.
 *
 * Keep lighting modest: the GLB no longer embeds Blender lights, and the
 * exterior dome is emissive — strong point lights wash the desk/walls white.
 */
function VictorianStudyVistaInner({ active = true }: ExperienceVistaProps) {
  const fireRef = useRef<THREE.PointLight>(null);
  const radius = getDeskArenaRadius();
  // Interior is scaled so walls sit ~radius+2.5 out; fireplace is on −X
  const fireX = -(radius + 1.2);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (fireRef.current) {
      fireRef.current.intensity =
        0.55 + Math.sin(t * 7.5) * 0.08 + Math.sin(t * 13.2) * 0.04;
    }
  });

  return (
    <group>
      <ExperienceEnvironment
        hdri="oldHall"
        background={false}
        blur={0.55}
        environmentIntensity={0.18}
      />

      <VictorianStudyInterior />

      <ambientLight intensity={0.22} color="#f0e0c8" />
      <hemisphereLight args={["#d8c8b0", "#2a2018", 0.28]} />
      <directionalLight
        position={[3, 8, 2]}
        intensity={0.35}
        color="#fff2dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
      />
      {/* Soft fireplace accent — left wall */}
      <pointLight
        ref={fireRef}
        position={[fireX, ARENA_FLOOR_Y + 0.85, -1.0]}
        intensity={0.55}
        color="#ff7a40"
        distance={12}
        decay={2}
      />
      {/* Gentle fill above the circular desk */}
      <pointLight
        position={[0, ARENA_FLOOR_Y + 2.8, 0]}
        intensity={0.28}
        color="#ffe2b8"
        distance={radius * 2.4}
        decay={2}
      />
    </group>
  );
}

export default function VictorianStudyVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <VictorianStudyVistaInner {...props} />
    </Suspense>
  );
}
