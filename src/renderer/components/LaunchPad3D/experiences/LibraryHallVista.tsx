import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ExperienceVistaProps } from "./types";

/** Warm library / hall vista through the window — shelves + dust motes. */
export default function LibraryHallVista({ active = true }: ExperienceVistaProps) {
  const lampRef = useRef<THREE.PointLight>(null);
  const dustRef = useRef<THREE.Points>(null);

  const dustGeo = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (lampRef.current) {
      lampRef.current.intensity = 1.1 + Math.sin(t * 2.1) * 0.15;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.02;
    }
  });

  return (
    <group position={[0, 0, 14]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 16]}>
        <planeGeometry args={[36, 28]} />
        <meshStandardMaterial color="#3d3228" roughness={0.9} />
      </mesh>
      {[-4, -1.5, 1.5, 4].map((x) => (
        <mesh key={x} position={[x, 0.5, 6]}>
          <boxGeometry args={[1.4, 4.5, 0.4]} />
          <meshStandardMaterial
            color="#5c4030"
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
      ))}
      <mesh position={[0, 6, 0]}>
        <boxGeometry args={[20, 0.3, 16]} />
        <meshStandardMaterial color="#4a3a2a" />
      </mesh>
      <ambientLight intensity={0.35} />
      <pointLight
        ref={lampRef}
        position={[0, 3, 3]}
        intensity={1.2}
        color="#ffd8a0"
        distance={20}
      />
      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          color="#e8dcc8"
          size={0.06}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
