import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ExperienceVistaProps } from "./types";

/**
 * City / office exterior through the window — towers + traffic light streaks.
 */
export default function OfficeTowerVista({ active = true }: ExperienceVistaProps) {
  const streaksRef = useRef<THREE.Group>(null);
  const blinkRef = useRef<THREE.PointLight>(null);

  const towers = useMemo(
    () =>
      [
        [-6, 2.5, 8, 1.8, 8, 1.8],
        [-2, 3.5, 10, 2.2, 11, 2],
        [3, 2.8, 7, 1.6, 9, 1.6],
        [7, 4, 11, 2.4, 13, 2.2],
        [0, 1.8, 14, 3, 6, 3],
      ] as [number, number, number, number, number, number][],
    []
  );

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (streaksRef.current) {
      streaksRef.current.children.forEach((child, i) => {
        const m = child as THREE.Mesh;
        m.position.x = ((t * (0.8 + i * 0.25) + i * 3) % 24) - 12;
      });
    }
    if (blinkRef.current) {
      blinkRef.current.intensity = 0.6 + (Math.sin(t * 3.2) > 0.4 ? 0.9 : 0);
    }
  });

  return (
    <group position={[0, 0, 12]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2a3038" roughness={0.9} metalness={0.2} />
      </mesh>

      {towers.map(([x, y, z, w, h, d], i) => (
        <mesh key={i} position={[x, y - 2.8 + h / 2, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#5a6a7c" : "#4a5868"}
            metalness={0.45}
            roughness={0.4}
            emissive="#3a80c0"
            emissiveIntensity={0.08 + (i % 3) * 0.04}
          />
        </mesh>
      ))}

      <group ref={streaksRef} position={[0, -2.4, 4]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[0, i * 0.08, -i * 0.5]}>
            <boxGeometry args={[1.2, 0.04, 0.08]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#ffaa44" : "#88ccff"}
              transparent
              opacity={0.75}
            />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 10, -15]}>
        <sphereGeometry args={[50, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshBasicMaterial color="#6a8498" side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#c8d8e8", "#2a3438", 0.7]} />
      <directionalLight
        position={[-8, 16, -4]}
        intensity={1.2}
        color="#e8f0ff"
      />
      <pointLight
        ref={blinkRef}
        position={[3, 4, 8]}
        intensity={1}
        color="#88aaff"
        distance={30}
      />
    </group>
  );
}
