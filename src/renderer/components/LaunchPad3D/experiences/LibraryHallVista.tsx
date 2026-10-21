import { Suspense, useRef } from "react";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ARENA_FLOOR_Y } from "../layouts/roomScreens";
import ExperienceEnvironment from "./ExperienceEnvironment";
import LibraryHallInterior from "./LibraryHallInterior";
import type { ExperienceVistaProps } from "./types";

/**
 * Library Hall — Sketchfab “library” interior with the circular desk seated
 * in the center of the hall. Sky fills arched window openings.
 */
function LibraryHallVistaInner({ active = true }: ExperienceVistaProps) {
  const lampRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!active || !lampRef.current) return;
    const t = clock.elapsedTime;
    lampRef.current.intensity = 0.55 + Math.sin(t * 1.3) * 0.06;
  });

  return (
    <group>
      <Sky
        sunPosition={[40, 22, -18]}
        turbidity={4}
        rayleigh={1.4}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <ExperienceEnvironment
        hdri="oldHall"
        background={false}
        blur={0.35}
        environmentIntensity={0.55}
      />

      <LibraryHallInterior />

      <ambientLight intensity={0.28} color="#ffe8d0" />
      <hemisphereLight args={["#e8f0ff", "#2a1c12", 0.4]} />
      <directionalLight
        position={[-8, 14, 4]}
        intensity={0.75}
        color="#fff2dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />
      <pointLight
        ref={lampRef}
        position={[0, ARENA_FLOOR_Y + 4.5, 0]}
        intensity={0.55}
        color="#ffc878"
        distance={22}
        decay={2}
      />
      <pointLight
        position={[0, ARENA_FLOOR_Y + 3.2, -6]}
        intensity={0.35}
        color="#ffe0b8"
        distance={16}
        decay={2}
      />
    </group>
  );
}

export default function LibraryHallVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <LibraryHallVistaInner {...props} />
    </Suspense>
  );
}
