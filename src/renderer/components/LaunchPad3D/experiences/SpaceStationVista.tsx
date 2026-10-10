import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import spaceDomeUrl from "../../../images/space_dome_milkyway.jpg";
import type { ExperienceVistaProps } from "./types";

function SpaceStationVistaInner({ active = true }: ExperienceVistaProps) {
  const starsRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.PointLight>(null);
  const spaceMap = useTexture(spaceDomeUrl);

  useEffect(() => {
    spaceMap.colorSpace = THREE.SRGBColorSpace;
    spaceMap.needsUpdate = true;
  }, [spaceMap]);

  const domeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: spaceMap,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    [spaceMap]
  );

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.018;
    if (pulseRef.current) {
      pulseRef.current.intensity = 1.2 + Math.sin(t * 1.4) * 0.5;
    }
  });

  return (
    <group position={[0, 1, 10]}>
      <mesh ref={starsRef} material={domeMat}>
        <sphereGeometry args={[22, 48, 24]} />
      </mesh>
      {/* Hull rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 4]}>
        <torusGeometry args={[5, 0.35, 12, 48]} />
        <meshStandardMaterial
          color="#8a9aac"
          metalness={0.7}
          roughness={0.3}
          emissive="#406080"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0, 4]}>
        <cylinderGeometry args={[1.2, 1.2, 6, 16, 1, true]} />
        <meshStandardMaterial
          color="#6a7a8c"
          metalness={0.65}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <ambientLight intensity={0.35} />
      <pointLight
        ref={pulseRef}
        position={[2, 2, 2]}
        intensity={1.4}
        color="#a0d0ff"
        distance={35}
      />
      <directionalLight position={[-5, 3, -8]} intensity={0.6} color="#ffffff" />
    </group>
  );
}

export default function SpaceStationVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <SpaceStationVistaInner {...props} />
    </Suspense>
  );
}
