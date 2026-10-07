import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

import type { CardPose, LaunchPadCard } from "./types";
import { useCardTexture } from "./useCardTextures";

const CARD_WIDTH = 2.4;
const CARD_HEIGHT = 1.5;

interface CardMeshProps {
  card: LaunchPadCard;
  pose: CardPose;
  focused: boolean;
  onSelect: (id: string) => void;
  onFocus: (id: string) => void;
  onBlur?: () => void;
  /** Flat monitor content — no title plate, brighter when focused */
  variant?: "card" | "screen";
  /** Longer for ring so the carousel eases instead of snapping */
  moveDuration?: number;
  /** When true, pointer-down won't start stage drag/pan (Mission) */
  blockStageDrag?: boolean;
}

function CardMesh({
  card,
  pose,
  focused,
  onSelect,
  onFocus,
  onBlur,
  variant = "card",
  moveDuration,
  blockStageDrag = false,
}: CardMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const { texture, failed } = useCardTexture(card.imageUrl);
  const isScreen = variant === "screen";
  const duration = moveDuration ?? (isScreen ? 0.35 : 0.45);
  const target = useRef({
    x: pose.position[0],
    y: pose.position[1],
    z: pose.position[2],
    rx: pose.rotation[0],
    ry: pose.rotation[1],
    rz: pose.rotation[2],
    s: pose.scale,
    o: pose.opacity,
  });

  useEffect(() => {
    const t = target.current;
    gsap.to(t, {
      x: pose.position[0],
      y: pose.position[1],
      z: pose.position[2],
      rx: pose.rotation[0],
      ry: pose.rotation[1],
      rz: pose.rotation[2],
      s: pose.scale,
      o: pose.opacity,
      duration,
      ease: "power2.inOut",
      overwrite: true,
    });
  }, [pose, duration]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const t = target.current;
    g.position.set(t.x, t.y, t.z);
    g.rotation.set(t.rx, t.ry, t.rz);
    g.scale.setScalar(t.s);
    if (matRef.current) {
      matRef.current.opacity = t.o;
      matRef.current.emissiveIntensity = isScreen && focused ? 0.22 : 0;
    }
  });

  const color = useMemo(() => {
    if (card.isActive) return "#4ea1ff";
    if (focused) return "#ffffff";
    return "#cfd6e0";
  }, [card.isActive, focused]);

  const showPlaceholder = !texture || failed;

  return (
    <group
      ref={groupRef}
      onPointerDown={
        blockStageDrag
          ? (e) => {
              e.stopPropagation();
            }
          : undefined
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect(card.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onFocus(card.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onBlur?.();
      }}
    >
      <mesh>
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <meshStandardMaterial
          ref={matRef}
          map={texture || undefined}
          color={showPlaceholder ? "#1a2433" : "#ffffff"}
          transparent
          opacity={pose.opacity}
          roughness={isScreen ? 0.35 : 0.55}
          metalness={isScreen ? 0.15 : 0.05}
          emissive={isScreen ? "#1a6cff" : "#000000"}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          toneMapped={!isScreen}
        />
      </mesh>

      <mesh position={[0, 0, -0.012]}>
        <planeGeometry
          args={[
            CARD_WIDTH + (isScreen ? 0.08 : 0.06),
            CARD_HEIGHT + (isScreen ? 0.08 : 0.06),
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={focused ? (isScreen ? 0.75 : 0.55) : isScreen ? 0.12 : 0.2}
        />
      </mesh>

      {showPlaceholder && (
        <mesh position={[0, 0.05, 0.02]}>
          <planeGeometry args={[0.55, 0.55]} />
          <meshBasicMaterial color="#6b778c" />
        </mesh>
      )}

      {!isScreen && (
        <mesh position={[0, -CARD_HEIGHT / 2 - 0.22, 0.02]}>
          <planeGeometry args={[CARD_WIDTH * 0.9, 0.28]} />
          <meshBasicMaterial color="#0d1118" transparent opacity={0.72} />
        </mesh>
      )}
    </group>
  );
}

export default CardMesh;
