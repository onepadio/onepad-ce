import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { EXPERIENCE_MODELS } from "./assetUrls";
import ExperienceEnvironment from "./ExperienceEnvironment";
import GltfProp from "./GltfProp";
import type { ExperienceVistaProps } from "./types";

function MountainLodgeVistaInner({ active = true }: ExperienceVistaProps) {
  const treeRef = useRef<THREE.Group>(null);
  const lampRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (treeRef.current) {
      treeRef.current.rotation.z = Math.sin(t * 0.7) * 0.04;
    }
    if (lampRef.current) {
      lampRef.current.intensity = 0.9 + Math.sin(t * 1.8) * 0.12;
    }
  });

  return (
    <group position={[0, 0, 14]}>
      <ExperienceEnvironment hdri="lodge" blur={0.4} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 16]}>
        <planeGeometry args={[40, 32]} />
        <meshStandardMaterial color="#4a6a48" roughness={0.95} />
      </mesh>

      {/* Distant peak silhouettes */}
      <mesh position={[-8, 0, 14]}>
        <coneGeometry args={[5, 10, 5]} />
        <meshStandardMaterial color="#6a7a88" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[2, 1, 16]}>
        <coneGeometry args={[7, 14, 5]} />
        <meshStandardMaterial color="#5a6a78" flatShading roughness={0.9} />
      </mesh>
      <mesh position={[10, -0.5, 12]}>
        <coneGeometry args={[4, 8, 5]} />
        <meshStandardMaterial color="#708090" flatShading roughness={0.9} />
      </mesh>

      <GltfProp
        url={EXPERIENCE_MODELS.rockMoss}
        position={[-3.5, -2.6, 5]}
        rotation={[0, 0.5, 0]}
        fitTo={4.5}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.rockMoss}
        position={[4.2, -2.6, 6.5]}
        rotation={[0, -1.3, 0]}
        fitTo={3.8}
        scale={0.9}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.rock01}
        position={[0.5, -2.6, 8]}
        rotation={[0.05, 1.8, 0]}
        fitTo={2.2}
        sitOnGround
      />

      <group ref={treeRef} position={[4, -1, 5]}>
        <mesh position={[0, 1.2, 0]}>
          <coneGeometry args={[1.1, 2.8, 7]} />
          <meshStandardMaterial color="#2d5a32" flatShading />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 1.2, 6]} />
          <meshStandardMaterial color="#4a3020" />
        </mesh>
      </group>

      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#c8e0ff", "#3a5030", 0.5]} />
      <directionalLight position={[-6, 14, -4]} intensity={1.1} color="#fff8e8" />
      <pointLight
        ref={lampRef}
        position={[1, 1, 2]}
        intensity={1}
        color="#ffc878"
        distance={15}
      />
    </group>
  );
}

export default function MountainLodgeVista(props: ExperienceVistaProps) {
  return (
    <Suspense fallback={null}>
      <MountainLodgeVistaInner {...props} />
    </Suspense>
  );
}
