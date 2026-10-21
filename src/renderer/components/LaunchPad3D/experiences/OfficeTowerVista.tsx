import { Suspense, useRef } from "react";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ARENA_FLOOR_Y } from "../layouts/roomScreens";
import ExperienceEnvironment from "./ExperienceEnvironment";
import OfficeHallInterior from "./OfficeHallInterior";
import type { ExperienceVistaProps } from "./types";

/**
 * Office Building — Blender open-plan interior with the circular desk
 * seated in the center. Sky + city masses show through curtain glass.
 */
function OfficeTowerVistaInner({ active = true }: ExperienceVistaProps) {
  const lampRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!active || !lampRef.current) return;
    const t = clock.elapsedTime;
    lampRef.current.intensity = 0.45 + Math.sin(t * 1.1) * 0.05;
  });

  return (
    <group>
      <Sky
        sunPosition={[80, 55, -30]}
        turbidity={1.6}
        rayleigh={0.55}
        mieCoefficient={0.003}
        mieDirectionalG={0.8}
      />
      <ExperienceEnvironment
        hdri="office"
        background={false}
        blur={0.2}
        environmentIntensity={0.85}
      />

      <OfficeHallInterior />

      <ambientLight intensity={0.42} color="#edf4ff" />
      <hemisphereLight args={["#b8d4f0", "#3d4a38", 0.55]} />
      <directionalLight
        position={[18, 28, -10]}
        intensity={1.55}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00025}
      />
      <directionalLight
        position={[-8, 14, 12]}
        intensity={0.35}
        color="#cfe0ff"
      />
      <pointLight
        ref={lampRef}
        position={[0, ARENA_FLOOR_Y + 4.8, 0]}
        intensity={0.35}
        color="#fff8f0"
        distance={22}
        decay={2}
      />
    </group>
  );
}

export default function OfficeTowerVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <OfficeTowerVistaInner {...props} />
    </Suspense>
  );
}
