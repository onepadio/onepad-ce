import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Image } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

import type { CardPose, LaunchPadCard } from "./types";
import { useCardTexture } from "./useCardTextures";
import { registerPlane, unregisterPlane } from "./planeRegistry";

const CARD_WIDTH = 2.4;
const CARD_HEIGHT = 1.5;
/** Centered favicon/app icon size when there is no screenshot/webview */
const ICON_SIZE = 0.55;
/** Corner radius for the centered icon (world units) */
const ICON_RADIUS = 0.12;

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
  /** Register this plane for live DOM webview projection */
  projectWebView?: boolean;
  /** Hide texture (live webview drawn on top) */
  contentTransparent?: boolean;
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
  projectWebView = false,
  contentTransparent = false,
}: CardMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const isIconPreview = card.previewMode === "icon";
  const { texture, failed } = useCardTexture(
    contentTransparent ? null : card.imageUrl
  );
  const isScreen = variant === "screen";
  const duration = moveDuration ?? (isScreen ? 0.35 : 0.45);

  useEffect(() => {
    if (!projectWebView) return;
    const g = groupRef.current;
    if (g) registerPlane(card.id, g);
    return () => unregisterPlane(card.id);
  }, [card.id, projectWebView]);
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

  // Screen/monitor bezel stays dark — light gray (#cfd6e0) was showing through
  // behind projected webviews. Launchpad cards keep the brighter plate.
  const color = useMemo(() => {
    if (isScreen) {
      if (card.isActive || focused) return "#1a2333";
      return "#121820";
    }
    if (card.isActive) return "#4ea1ff";
    if (focused) return "#ffffff";
    return "#cfd6e0";
  }, [card.isActive, focused, isScreen]);

  // Icon-only cards: dark panel + small centered icon (never stretch favicon full-bleed)
  const useIconLayout = !contentTransparent && isIconPreview;
  const showPlaceholder =
    !contentTransparent && useIconLayout && (!texture || failed);

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
          map={
            contentTransparent || useIconLayout
              ? undefined
              : texture || undefined
          }
          color={
            contentTransparent || useIconLayout
              ? "#0a1018"
              : showPlaceholder
                ? "#1a2433"
                : "#ffffff"
          }
          transparent
          opacity={contentTransparent ? 0.06 : pose.opacity}
          roughness={isScreen ? 0.35 : 0.55}
          metalness={isScreen ? 0.15 : 0.05}
          emissive={isScreen ? "#1a6cff" : "#000000"}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          toneMapped={!isScreen}
          depthWrite={!contentTransparent}
        />
      </mesh>

      <mesh position={[0, 0, -0.012]}>
        <planeGeometry
          args={[
            CARD_WIDTH + (isScreen ? 0.06 : 0.06),
            CARD_HEIGHT + (isScreen ? 0.06 : 0.06),
          ]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={
            isScreen
              ? focused
                ? 0.55
                : 0.35
              : focused
                ? 0.55
                : 0.2
          }
        />
      </mesh>

      {/* Small centered favicon / app icon when no screenshot or live webview */}
      {useIconLayout && texture && !failed && (
        <Image
          texture={texture}
          scale={[ICON_SIZE, ICON_SIZE]}
          position={[0, 0, 0.02]}
          radius={ICON_RADIUS}
          transparent
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      )}

      {showPlaceholder && (
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[ICON_SIZE, ICON_SIZE]} />
          <meshBasicMaterial color="#6b778c" transparent opacity={0.85} />
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
