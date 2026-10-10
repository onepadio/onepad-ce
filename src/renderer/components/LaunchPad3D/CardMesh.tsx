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
/** Larger icon on desk/room monitors so the screen doesn’t look empty */
const ICON_SIZE_SCREEN = 0.95;
/** Corner radius for the centered icon (world units) */
const ICON_RADIUS = 0.12;
const ICON_RADIUS_SCREEN = 0.18;
/** Screen plate corner radius in local card units */
const SCREEN_PLATE_RADIUS = 0.1;

function roundedPlaneGeometry(
  width: number,
  height: number,
  radius: number
): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w - 0.01, h - 0.01);
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return new THREE.ShapeGeometry(shape, 16);
}

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
    // Desk / continuous-angle drive: snap every pose update (no GSAP lag)
    if (duration <= 0.001) {
      t.x = pose.position[0];
      t.y = pose.position[1];
      t.z = pose.position[2];
      t.rx = pose.rotation[0];
      t.ry = pose.rotation[1];
      t.rz = pose.rotation[2];
      t.s = pose.scale;
      t.o = pose.opacity;
      return;
    }
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

  // Icon-only: panel + centered favicon (never stretch favicon full-bleed)
  const useIconLayout = !contentTransparent && isIconPreview;
  const showPlaceholder =
    !contentTransparent && useIconLayout && (!texture || failed);
  // Translucent back plates z-sort against the favicon — launchpad cards only
  const showBackPlate = !useIconLayout && !contentTransparent && !isScreen;
  const iconSize = isScreen ? ICON_SIZE_SCREEN : ICON_SIZE;
  const iconRadius = isScreen ? ICON_RADIUS_SCREEN : ICON_RADIUS;
  // Content forward of desk bezel; icon further forward than the plate
  const plateZ = isScreen ? 0.08 : 0;
  const iconZ = isScreen ? 0.28 : 0.16;
  // Screen slot is wider aspect than the card plane — nudge width so it fills the frame
  const plateW = isScreen ? CARD_WIDTH * 1.08 : CARD_WIDTH;
  const plateGeo = useMemo(
    () =>
      isScreen
        ? roundedPlaneGeometry(plateW, CARD_HEIGHT, SCREEN_PLATE_RADIUS)
        : null,
    [isScreen, plateW]
  );

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
      <mesh
        position={[0, 0, plateZ]}
        {...(plateGeo ? { geometry: plateGeo } : {})}
      >
        {!isScreen && <planeGeometry args={[plateW, CARD_HEIGHT]} />}
        <meshStandardMaterial
          ref={matRef}
          map={
            contentTransparent || useIconLayout
              ? undefined
              : texture || undefined
          }
          color={
            contentTransparent
              ? "#0d1520"
              : useIconLayout
                ? "#151c28"
                : showPlaceholder
                  ? "#1a2433"
                  : "#ffffff"
          }
          transparent={!!contentTransparent}
          opacity={contentTransparent ? 0.04 : pose.opacity}
          roughness={isScreen ? 0.5 : 0.55}
          metalness={isScreen ? 0.12 : 0.05}
          emissive={useIconLayout && isScreen ? "#1a3050" : "#000000"}
          emissiveIntensity={useIconLayout && isScreen ? 0.35 : 0}
          side={THREE.FrontSide}
          toneMapped={!isScreen}
          depthWrite={!contentTransparent}
        />
      </mesh>

      {showBackPlate ? (
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[CARD_WIDTH + 0.06, CARD_HEIGHT + 0.06]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={focused ? 0.55 : 0.2}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {useIconLayout && texture && !failed && (
        <Image
          texture={texture}
          scale={[iconSize, iconSize]}
          position={[0, 0, iconZ]}
          radius={iconRadius}
          transparent
          toneMapped={false}
          side={THREE.FrontSide}
          depthWrite
        />
      )}

      {showPlaceholder && (
        <mesh position={[0, 0, iconZ]}>
          <planeGeometry args={[iconSize, iconSize]} />
          <meshBasicMaterial color="#6b778c" depthWrite />
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
