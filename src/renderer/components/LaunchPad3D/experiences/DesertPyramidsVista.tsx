import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { EXPERIENCE_MODELS } from "./assetUrls";
import ExperienceEnvironment from "./ExperienceEnvironment";
import GltfProp from "./GltfProp";
import type { ExperienceVistaProps } from "./types";

function Pyramid({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <coneGeometry args={[2.2, 2.8, 4]} />
      <meshStandardMaterial
        color="#c4a574"
        flatShading
        metalness={0.05}
        roughness={0.92}
      />
    </mesh>
  );
}

function DesertPyramidsVistaInner({ active = true }: ExperienceVistaProps) {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const dustRef = useRef<THREE.Points>(null);

  const dustGeo = useMemo(() => {
    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = Math.random() * 8 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (sunRef.current) {
      const a = t * 0.04;
      sunRef.current.position.set(Math.cos(a) * 18, 10 + Math.sin(a) * 2, -8);
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = t * 0.03;
      const positions = dustRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i) + 0.004;
        positions.setY(i, y > 7 ? -1 : y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 14]}>
      <ExperienceEnvironment hdri="desert" blur={0.25} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.6, 18]}
        receiveShadow
      >
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#d4b896" roughness={0.95} metalness={0} />
      </mesh>

      <Pyramid position={[-4, -1.2, 10]} scale={1.4} />
      <Pyramid position={[2.5, -1.4, 14]} scale={1} />
      <Pyramid position={[7, -1.5, 9]} scale={0.7} />

      <GltfProp
        url={EXPERIENCE_MODELS.boulder01}
        position={[-6.5, -2.6, 5]}
        rotation={[0, 0.8, 0]}
        fitTo={3.2}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.rock01}
        position={[5.5, -2.6, 4]}
        rotation={[0, -1.1, 0]}
        fitTo={2.4}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.rock01}
        position={[1.2, -2.6, 7.5]}
        rotation={[0.1, 2.2, 0]}
        fitTo={1.6}
        scale={0.85}
        sitOnGround
      />
      <GltfProp
        url={EXPERIENCE_MODELS.boulder01}
        position={[-1.5, -2.6, 11]}
        rotation={[0, -0.4, 0]}
        fitTo={2.0}
        sitOnGround
      />

      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#ffe8c0", "#8a6a40", 0.45]} />
      <directionalLight
        ref={sunRef}
        position={[12, 14, -6]}
        intensity={1.35}
        color="#fff0d0"
        castShadow
      />

      <points ref={dustRef} geometry={dustGeo}>
        <pointsMaterial
          color="#e8d4b0"
          size={0.08}
          transparent
          opacity={0.45}
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
