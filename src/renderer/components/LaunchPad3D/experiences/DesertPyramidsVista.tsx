import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import ExperienceEnvironment from "./ExperienceEnvironment";
import DesertPyramidsInterior from "./DesertPyramidsInterior";
import type { ExperienceVistaProps } from "./types";

function DesertPyramidsVistaInner({ active = true }: ExperienceVistaProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const dustRef = useRef<THREE.Points>(null);

  const dustGeo = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 10 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (sunRef.current) {
      const a = t * 0.035;
      sunRef.current.position.set(Math.cos(a) * 22, 12 + Math.sin(a) * 2.5, -10);
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.025;
      const positions = dustRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i) + 0.0035;
        positions.setY(i, y > 9 ? -1 : y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group>
      <ExperienceEnvironment hdri="desert" blur={0.22} />

      <DesertPyramidsInterior />

      <ambientLight intensity={0.32} color="#ffe8c8" />
      <hemisphereLight args={["#ffe8c0", "#8a6a40", 0.42]} />
      <directionalLight
        ref={sunRef}
        position={[14, 16, -8]}
        intensity={1.4}
        color="#fff0d0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00025}
      />

      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          color="#e8d4b0"
          size={0.07}
          transparent
          opacity={0.4}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

export default function DesertPyramidsVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <DesertPyramidsVistaInner {...props} />
    </Suspense>
  );
}
