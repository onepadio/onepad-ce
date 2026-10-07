import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type WheelEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, ContactShadows, OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useDispatch, useSelector } from "react-redux";

import CardMesh from "./CardMesh";
import ControlRoomEnvironment from "./ControlRoomEnvironment";
import MonitorBank from "./MonitorBank";
import {
  computeCardPose,
  getCameraTargetForLayout,
  getSceneMaxCards,
  usesRoomScene,
  getRingDefaultZoom,
  clampRingZoom,
  clampRingViewPitch,
  getMissionScrollLimits,
  getMissionCardY,
  getMissionDefaultZoom,
  clampMissionZoom,
} from "./layouts/layoutMath";
import { ARENA_FLOOR_Y, getArenaRadius } from "./layouts/roomScreens";
import type { LaunchPadCard, Launchpad3dLayoutId } from "./types";
import { persistDesktop3dZoomForWorkspace } from "../../util/desktop3dZooms";

/** Soft cap for wallpaper layouts (ring / mission / cover) */
const WALLPAPER_CARD_MAX = 48;

export interface Desktop3DHudSlots {
  top?: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
}

interface SceneProps {
  cards: LaunchPadCard[];
  layout: Launchpad3dLayoutId;
  focusedIndex: number;
  browseOffset: number;
  onSelect: (id: string) => void;
  onFocusIndex: (index: number) => void;
  active: boolean;
  fullscreen?: boolean;
  hud?: Desktop3DHudSlots;
  ringZoomDistance: number;
  missionScrollY: number;
  missionZoomDistance: number;
  ringViewPitch: number;
  workspace: any;
}

function CameraRig({
  layout,
  active,
  fullscreen,
  focusedIndex,
  zoomToScreen,
  cardCount,
  overviewZoomDistance,
  ringZoomDistance,
  missionScrollY,
  missionZoomDistance,
  ringViewPitch,
  browseOffset = 0,
  ringZoomCardIndex = -1,
  ringZoomPhase = null,
}: {
  layout: Launchpad3dLayoutId;
  active: boolean;
  fullscreen?: boolean;
  focusedIndex: number;
  zoomToScreen: boolean;
  cardCount: number;
  overviewZoomDistance: number | null;
  ringZoomDistance: number;
  missionScrollY: number;
  missionZoomDistance: number;
  ringViewPitch: number;
  browseOffset?: number;
  ringZoomCardIndex?: number;
  ringZoomPhase?: "approach" | "front" | null;
}) {
  const { camera, gl, controls } = useThree();
  const roomScene = usesRoomScene(layout) || !!fullscreen;
  const zoomDistRef = useRef(overviewZoomDistance);
  zoomDistRef.current = overviewZoomDistance;

  useEffect(() => {
    gl.setClearColor(roomScene ? 0x2a3a52 : 0x000000, roomScene ? 1 : 0);
  }, [gl, roomScene]);

  useEffect(() => {
    if (!active) return;
    const cam = camera as THREE.PerspectiveCamera;
    const orbit = controls as OrbitControlsImpl | null;
    const duration =
      roomScene
        ? 0.7
        : (layout === "mission" || layout === "ring") && zoomToScreen
          ? ringZoomPhase === "front"
            ? 0.75
            : 0.55
          : layout === "ring"
            ? 0.18
            : 0.4;
    const target = getCameraTargetForLayout(
      layout,
      roomScene,
      focusedIndex,
      zoomToScreen,
      cardCount,
      zoomToScreen ? null : zoomDistRef.current,
      ringZoomDistance,
      missionScrollY,
      missionZoomDistance,
      ringViewPitch,
      ringZoomCardIndex,
      browseOffset,
      ringZoomPhase
    );
    const look = new THREE.Vector3(...target.lookAt);
    const fov = target.fov ?? (roomScene ? 48 : 45);

    const syncOrbit = () => {
      cam.lookAt(look);
      if (orbit) {
        orbit.target.copy(look);
        orbit.update();
      }
    };

    gsap.to(cam.position, {
      x: target.position[0],
      y: target.position[1],
      z: target.position[2],
      duration,
      ease: "power2.inOut",
      onUpdate: syncOrbit,
      onComplete: syncOrbit,
    });
    gsap.to(cam, {
      fov,
      duration,
      ease: "power2.inOut",
      onUpdate: () => cam.updateProjectionMatrix(),
    });
  }, [
    layout,
    zoomToScreen,
    focusedIndex,
    cardCount,
    camera,
    active,
    roomScene,
    controls,
    ringZoomDistance,
    missionScrollY,
    missionZoomDistance,
    ringViewPitch,
    browseOffset,
    ringZoomCardIndex,
    ringZoomPhase,
  ]);

  return null;
}

/** Look around from the arena center (drag) + wheel zoom toward the wall */
function SceneOrbitControls({
  zoomToScreen,
  lookAt,
  cardCount,
  workspace,
}: {
  zoomToScreen: boolean;
  lookAt: [number, number, number];
  cardCount: number;
  workspace: any;
}) {
  const dispatch = useDispatch();
  const { camera } = useThree();
  const radius = getArenaRadius(Math.max(cardCount, 1));
  // Allow dollying almost up to the wall so screens can fill the view
  const maxDist = Math.max(4, radius - 0.85);
  const minDist = zoomToScreen ? 0.9 : 0.2;

  const persistOverviewZoom = useCallback(() => {
    if (zoomToScreen) return;
    const target = new THREE.Vector3(...lookAt);
    const distance = camera.position.distanceTo(target);
    if (!Number.isFinite(distance)) return;
    void persistDesktop3dZoomForWorkspace(
      dispatch,
      workspace,
      "scene",
      distance
    );
  }, [camera, lookAt, zoomToScreen, dispatch, workspace]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableRotate
      enableZoom
      enableDamping
      dampingFactor={0.08}
      zoomSpeed={1.35}
      rotateSpeed={0.6}
      minDistance={minDist}
      maxDistance={zoomToScreen ? maxDist : maxDist}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.72}
      target={lookAt}
      // Drag to turn; wheel to zoom; left-click without drag still hits screens
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.DOLLY,
      }}
      onEnd={persistOverviewZoom}
    />
  );
}

function SceneHud({ hud }: { hud?: Desktop3DHudSlots }) {
  if (!hud) return null;
  return (
    <>
      {hud.top ? (
        <Html
          position={[0, 3.6, 1.2]}
          center
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div className="desktop-3d-hud desktop-3d-hud-top">{hud.top}</div>
        </Html>
      ) : null}
      {hud.topLeft ? (
        <Html
          position={[-5.2, 3.2, 0.8]}
          center
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <div className="desktop-3d-hud desktop-3d-hud-top-left">
            {hud.topLeft}
          </div>
        </Html>
      ) : null}
      {hud.topRight ? (
        <Html
          position={[5.2, 3.2, 0.8]}
          center
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <div className="desktop-3d-hud desktop-3d-hud-top-right">
            {hud.topRight}
          </div>
        </Html>
      ) : null}
      {hud.bottomRight ? (
        <Html
          position={[4.8, -2.6, 1.5]}
          center
          distanceFactor={14}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: "auto" }}
        >
          <div className="desktop-3d-hud desktop-3d-hud-bottom-right">
            {hud.bottomRight}
          </div>
        </Html>
      ) : null}
    </>
  );
}

function SceneContent({
  cards,
  layout,
  focusedIndex,
  browseOffset,
  onSelect,
  onFocusIndex,
  active,
  fullscreen,
  hud,
  ringZoomDistance,
  missionScrollY,
  missionZoomDistance,
  ringViewPitch,
  workspace,
}: SceneProps) {
  const roomScene = usesRoomScene(layout) || !!fullscreen;
  const limited = cards.slice(
    0,
    roomScene ? getSceneMaxCards() : WALLPAPER_CARD_MAX
  );
  const overviewZoomDistance = useSelector(
    (state: any) =>
      (state.settings.desktop3dSceneZoomDistance as number | null) ?? null
  );
  const [cameraZoomed, setCameraZoomed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [ringZoomCardIndex, setRingZoomCardIndex] = useState(-1);
  const [ringZoomPhase, setRingZoomPhase] = useState<
    "approach" | "front" | null
  >(null);
  const activateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearActivateTimer = useCallback(() => {
    if (activateTimerRef.current) {
      clearTimeout(activateTimerRef.current);
      activateTimerRef.current = null;
    }
    if (ringPhaseTimerRef.current) {
      clearTimeout(ringPhaseTimerRef.current);
      ringPhaseTimerRef.current = null;
    }
  }, []);

  // Reset zoom / hover when layout mode changes
  useEffect(() => {
    clearActivateTimer();
    setCameraZoomed(false);
    setRingZoomCardIndex(-1);
    setRingZoomPhase(null);
    setHoveredIndex(-1);
  }, [roomScene, layout, clearActivateTimer]);

  useEffect(() => {
    return () => clearActivateTimer();
  }, [clearActivateTimer]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!cameraZoomed) return;
      if (!roomScene && layout !== "mission" && layout !== "ring") return;
      e.preventDefault();
      clearActivateTimer();
      setCameraZoomed(false);
      setRingZoomCardIndex(-1);
      setRingZoomPhase(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [roomScene, layout, cameraZoomed, clearActivateTimer]);

  const handleCardSelect = useCallback(
    (id: string) => {
      const i = limited.findIndex((c) => c.id === id);
      if (i < 0) return;

      // Scene: zoom to icon, then activate
      if (roomScene) {
        if (cameraZoomed && i === focusedIndex) {
          clearActivateTimer();
          onSelect(id);
          return;
        }
        clearActivateTimer();
        onFocusIndex(i);
        setCameraZoomed(true);
        activateTimerRef.current = setTimeout(() => {
          activateTimerRef.current = null;
          onSelect(id);
        }, 1000);
        return;
      }

      // Mission / Ring: zoom toward icon → settle face-on → activate
      if (layout === "mission" || layout === "ring") {
        if (
          cameraZoomed &&
          ringZoomCardIndex === i &&
          ringZoomPhase === "front"
        ) {
          clearActivateTimer();
          onSelect(id);
          return;
        }
        clearActivateTimer();
        setRingZoomCardIndex(i);
        setRingZoomPhase("approach");
        setCameraZoomed(true);
        setHoveredIndex(i);
        if (layout === "mission") {
          onFocusIndex(i);
        }

        ringPhaseTimerRef.current = setTimeout(() => {
          ringPhaseTimerRef.current = null;
          // Face the icon square-on (ring also rotates it to the front slot)
          onFocusIndex(i);
          setRingZoomPhase("front");
        }, 480);

        activateTimerRef.current = setTimeout(() => {
          activateTimerRef.current = null;
          onSelect(id);
        }, 1200);
        return;
      }

      onSelect(id);
    },
    [
      limited,
      roomScene,
      layout,
      cameraZoomed,
      focusedIndex,
      ringZoomCardIndex,
      ringZoomPhase,
      onSelect,
      onFocusIndex,
      clearActivateTimer,
    ]
  );

  const highlightIndex =
    roomScene && cameraZoomed
      ? focusedIndex
      : (layout === "mission" || layout === "ring") &&
          cameraZoomed &&
          ringZoomCardIndex >= 0
        ? ringZoomCardIndex
        : hoveredIndex >= 0
          ? hoveredIndex
          : focusedIndex;

  const zoomToIcon =
    ((roomScene || layout === "mission" || layout === "ring") &&
      cameraZoomed) ||
    false;

  const cameraLookAt = useMemo((): [number, number, number] => {
    const t = getCameraTargetForLayout(
      layout,
      roomScene,
      focusedIndex,
      zoomToIcon,
      limited.length,
      overviewZoomDistance,
      ringZoomDistance,
      missionScrollY,
      missionZoomDistance,
      ringViewPitch,
      ringZoomCardIndex,
      browseOffset,
      ringZoomPhase
    );
    return t.lookAt;
  }, [
    layout,
    roomScene,
    focusedIndex,
    zoomToIcon,
    limited.length,
    overviewZoomDistance,
    ringZoomDistance,
    missionScrollY,
    missionZoomDistance,
    ringViewPitch,
    ringZoomCardIndex,
    browseOffset,
    ringZoomPhase,
  ]);

  return (
    <>
      <ambientLight intensity={roomScene ? 0.85 : 0.65} />
      {!roomScene && (
        <>
          <directionalLight position={[5, 8, 10]} intensity={1.15} castShadow />
          <directionalLight position={[-6, 3, -3]} intensity={0.4} />
          <pointLight position={[0, 4, 4]} intensity={0.35} color="#9ec5ff" />
        </>
      )}
      <CameraRig
        layout={layout}
        active={active}
        fullscreen={roomScene}
        focusedIndex={focusedIndex}
        zoomToScreen={zoomToIcon}
        cardCount={limited.length}
        overviewZoomDistance={overviewZoomDistance}
        ringZoomDistance={ringZoomDistance}
        missionScrollY={missionScrollY}
        missionZoomDistance={missionZoomDistance}
        ringViewPitch={ringViewPitch}
        browseOffset={browseOffset}
        ringZoomCardIndex={ringZoomCardIndex}
        ringZoomPhase={ringZoomPhase}
      />
      {roomScene && (
        <SceneOrbitControls
          zoomToScreen={cameraZoomed}
          lookAt={cameraLookAt}
          cardCount={limited.length}
          workspace={workspace}
        />
      )}

      {(layout === "mission" || layout === "ring") && cameraZoomed ? (
        <mesh
          position={[0, layout === "mission" ? missionScrollY : 0, -1]}
          onClick={(e) => {
            e.stopPropagation();
            clearActivateTimer();
            setCameraZoomed(false);
            setRingZoomCardIndex(-1);
            setRingZoomPhase(null);
          }}
        >
          <planeGeometry args={[48, 48]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}

      {roomScene ? (
        <>
          <ControlRoomEnvironment count={limited.length} />
          <MonitorBank
            count={limited.length}
            focusedIndex={cameraZoomed ? focusedIndex : -1}
            hoveredIndex={hoveredIndex}
          />
          <ContactShadows
            position={[0, ARENA_FLOOR_Y + 0.02, 0]}
            opacity={0.55}
            scale={getArenaRadius(limited.length) * 2.4}
            blur={2.2}
            far={14}
          />
          {/* Floor click returns to overview */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, ARENA_FLOOR_Y + 0.03, 0]}
            onClick={(e) => {
              e.stopPropagation();
              clearActivateTimer();
              setCameraZoomed(false);
              setHoveredIndex(-1);
            }}
          >
            <circleGeometry args={[getArenaRadius(limited.length) + 1.5, 48]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      {roomScene && <SceneHud hud={hud} />}

      <group>
        {limited.map((card, index) => {
          const pose = computeCardPose(layout, {
            index,
            count: limited.length,
            focusedIndex: roomScene ? focusedIndex : focusedIndex,
            browseOffset,
          });
          const focused = index === highlightIndex;
          return (
            <group key={card.id}>
              <CardMesh
                card={card}
                pose={pose}
                focused={focused}
                variant={roomScene ? "screen" : "card"}
                moveDuration={layout === "ring" ? 0.85 : undefined}
                blockStageDrag={layout === "mission"}
                onSelect={handleCardSelect}
                onFocus={(id) => {
                  const i = limited.findIndex((c) => c.id === id);
                  if (i < 0) return;
                  if (layout === "mission") {
                    // Mission: hover only highlights — don't pan the grid
                    setHoveredIndex(i);
                    return;
                  }
                  if (roomScene) {
                    setHoveredIndex(i);
                    return;
                  }
                  // While zoomed on a ring icon, keep focus locked
                  if (layout === "ring" && cameraZoomed) {
                    setHoveredIndex(i);
                    return;
                  }
                  // Ring / Cover: moving over icons rotates focus to that card
                  setHoveredIndex(i);
                  onFocusIndex(i);
                }}
                onBlur={() => setHoveredIndex(-1)}
              />
              {index === highlightIndex && (
                <Html
                  position={[
                    pose.position[0],
                    pose.position[1] -
                      (roomScene ? 0.85 : cameraZoomed ? 0.95 : 1.15),
                    pose.position[2] + (roomScene ? 0.08 : 0.15),
                  ]}
                  center
                  distanceFactor={
                    roomScene
                      ? cameraZoomed
                        ? 6
                        : 10
                      : cameraZoomed
                        ? 5.5
                        : 8
                  }
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  <div className="launchpad-3d-card-label">
                    <div className="launchpad-3d-card-title">{card.title}</div>
                    {card.subtitle ? (
                      <div className="launchpad-3d-card-subtitle">
                        {card.subtitle}
                      </div>
                    ) : null}
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </>
  );
}

export interface LaunchPad3DStageProps {
  cards: LaunchPadCard[];
  layout: Launchpad3dLayoutId;
  focusedIndex: number;
  browseOffset?: number;
  onSelect: (id: string) => void;
  onFocusIndex: (index: number) => void;
  onBrowseDelta?: (delta: number) => void;
  onBrowseRowDelta?: (delta: number) => void;
  active?: boolean;
  fullscreen?: boolean;
  hud?: Desktop3DHudSlots;
  className?: string;
  style?: CSSProperties;
}

function LaunchPad3DStage({
  cards,
  layout,
  focusedIndex,
  browseOffset = 0,
  onSelect,
  onFocusIndex,
  onBrowseDelta,
  onBrowseRowDelta,
  active = true,
  fullscreen = false,
  hud,
  className,
  style,
}: LaunchPad3DStageProps) {
  const dispatch = useDispatch();
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const workspaceId = workspace?.id;
  const storedRingZoom = useSelector(
    (state: any) =>
      (state.settings.desktop3dRingZoomDistance as number | null) ?? null
  );
  const storedRingPitch = useSelector(
    (state: any) =>
      (state.settings.desktop3dRingViewPitch as number | null) ?? null
  );
  const storedMissionZoom = useSelector(
    (state: any) =>
      (state.settings.desktop3dMissionZoomDistance as number | null) ?? null
  );
  const dragRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    panning: boolean;
    mode: null | "pitch" | "browse" | "pan";
  }>({
    x: 0,
    y: 0,
    active: false,
    panning: false,
    mode: null,
  });
  const ringBrowseLockUntil = useRef(0);
  const coverWheelAccum = useRef(0);
  const coverBrowseLockUntil = useRef(0);
  const zoomPersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wallpaperCount = Math.min(cards.length, WALLPAPER_CARD_MAX);
  const [ringZoomDistance, setRingZoomDistance] = useState(() =>
    storedRingZoom != null
      ? clampRingZoom(storedRingZoom)
      : getRingDefaultZoom(Math.max(wallpaperCount, 1))
  );
  const [ringViewPitch, setRingViewPitch] = useState(() =>
    storedRingPitch != null ? clampRingViewPitch(storedRingPitch) : 0
  );
  const [missionScrollY, setMissionScrollY] = useState(0);
  const [missionZoomDistance, setMissionZoomDistance] = useState(() =>
    storedMissionZoom != null
      ? clampMissionZoom(storedMissionZoom, Math.max(wallpaperCount, 1))
      : getMissionDefaultZoom(Math.max(wallpaperCount, 1))
  );
  const [frameloop, setFrameloop] = useState<"always" | "demand">(
    active ? "always" : "demand"
  );

  useEffect(() => {
    setFrameloop(active ? "always" : "demand");
  }, [active]);

  // Restore this space's saved zooms when the space changes
  useEffect(() => {
    setMissionScrollY(0);
    setRingViewPitch(
      storedRingPitch != null ? clampRingViewPitch(storedRingPitch) : 0
    );
    setRingZoomDistance(
      storedRingZoom != null
        ? clampRingZoom(storedRingZoom)
        : getRingDefaultZoom(Math.max(wallpaperCount, 1))
    );
    setMissionZoomDistance(
      storedMissionZoom != null
        ? clampMissionZoom(storedMissionZoom, Math.max(wallpaperCount, 1))
        : getMissionDefaultZoom(Math.max(wallpaperCount, 1))
    );
    // Only re-hydrate when switching spaces — not on every zoom write-back
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Reset mission pan when switching layout; keep persisted ring pitch/zoom
  useEffect(() => {
    setMissionScrollY(0);
  }, [layout]);

  useEffect(() => {
    if (layout !== "ring") return;
    setRingZoomDistance((prev) =>
      clampRingZoom(Math.max(prev, getRingDefaultZoom(Math.max(wallpaperCount, 1))))
    );
  }, [wallpaperCount, layout]);

  useEffect(() => {
    if (layout !== "mission") return;
    setMissionZoomDistance((prev) =>
      clampMissionZoom(
        Math.max(prev, getMissionDefaultZoom(Math.max(wallpaperCount, 1))),
        Math.max(wallpaperCount, 1)
      )
    );
  }, [wallpaperCount, layout]);

  const schedulePersistZoom = useCallback(
    (key: "ring" | "mission" | "ringPitch", value: number) => {
      if (zoomPersistTimer.current) clearTimeout(zoomPersistTimer.current);
      zoomPersistTimer.current = setTimeout(() => {
        zoomPersistTimer.current = null;
        void persistDesktop3dZoomForWorkspace(dispatch, workspace, key, value);
      }, 280);
    },
    [dispatch, workspace]
  );

  useEffect(() => {
    return () => {
      if (zoomPersistTimer.current) clearTimeout(zoomPersistTimer.current);
    };
  }, []);

  // Keep the focused mission card in view when navigating with keys
  useEffect(() => {
    if (layout !== "mission" || wallpaperCount === 0) return;
    const targetY = getMissionCardY(focusedIndex, wallpaperCount);
    const limit = getMissionScrollLimits(wallpaperCount);
    setMissionScrollY((prev) => {
      const viewCenter = prev;
      const margin = 1.35;
      if (targetY > viewCenter + margin) {
        return Math.min(limit, targetY - margin * 0.35);
      }
      if (targetY < viewCenter - margin) {
        return Math.max(-limit, targetY + margin * 0.35);
      }
      return prev;
    });
  }, [focusedIndex, layout, wallpaperCount]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Scene overview: mouse is for picking screens — don't scroll-browse
      if (layout === "scene") return;
      e.preventDefault();

      // Ring: wheel zooms the camera in/out (drag / arrows still browse)
      if (layout === "ring") {
        const delta = e.deltaY * 0.012;
        setRingZoomDistance((prev) => {
          const next = clampRingZoom(prev + delta);
          schedulePersistZoom("ring", next);
          return next;
        });
        return;
      }

      // Mission: wheel zooms; Shift+wheel (or horizontal) scrolls
      if (layout === "mission") {
        const n = Math.max(wallpaperCount, 1);
        if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          const limit = getMissionScrollLimits(n);
          if (limit <= 0) return;
          const delta =
            (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) *
            0.01;
          setMissionScrollY((prev) =>
            Math.min(limit, Math.max(-limit, prev - delta))
          );
          return;
        }
        const delta = e.deltaY * 0.014;
        setMissionZoomDistance((prev) => {
          const next = clampMissionZoom(prev + delta, n);
          schedulePersistZoom("mission", next);
          return next;
        });
        return;
      }

      if (!onBrowseDelta) return;
      // Cover Flow: accumulate wheel so trackpads don't skip icons
      const now = performance.now();
      if (now < coverBrowseLockUntil.current) {
        coverWheelAccum.current = 0;
        return;
      }
      coverWheelAccum.current += e.deltaY + e.deltaX * 0.6;
      const threshold = 90;
      if (Math.abs(coverWheelAccum.current) < threshold) return;
      const dir = coverWheelAccum.current > 0 ? 1 : -1;
      coverWheelAccum.current = 0;
      coverBrowseLockUntil.current = now + 240;
      onBrowseDelta(dir);
    },
    [onBrowseDelta, layout, wallpaperCount, schedulePersistZoom]
  );

  const handlePointerDown = useCallback((e: PointerEvent) => {
    // Ignore presses that start on a card label / interactive chrome
    const target = e.target as HTMLElement | null;
    if (target?.closest?.(".launchpad-3d-card-label")) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      active: true,
      panning: false,
      mode: null,
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      // Scene: mouse chooses monitors by click — no drag browsing
      if (layout === "scene") return;
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;

      if (layout === "mission") {
        const limit = getMissionScrollLimits(wallpaperCount);
        // Require a clear drag before panning so hover/click on icons doesn't nudge the grid
        const threshold = 28;
        if (!dragRef.current.panning) {
          if (Math.abs(dy) < threshold && Math.abs(dx) < threshold) return;
          dragRef.current.panning = true;
          dragRef.current.mode = "pan";
          dragRef.current.x = e.clientX;
          dragRef.current.y = e.clientY;
          return;
        }
        if (limit > 0 && Math.abs(dy) > 2) {
          const delta = dy * 0.02;
          setMissionScrollY((prev) =>
            Math.min(limit, Math.max(-limit, prev + delta))
          );
          dragRef.current.y = e.clientY;
          dragRef.current.x = e.clientX;
        }
        return;
      }

      // Ring: vertical drag tilts view; horizontal drag browses the carousel
      if (layout === "ring") {
        if (!dragRef.current.mode) {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
          dragRef.current.mode =
            Math.abs(dy) > Math.abs(dx) * 1.15 ? "pitch" : "browse";
          dragRef.current.x = e.clientX;
          dragRef.current.y = e.clientY;
          return;
        }
        if (dragRef.current.mode === "pitch") {
          setRingViewPitch((prev) => {
            const next = clampRingViewPitch(prev + dy * 0.0075);
            schedulePersistZoom("ringPitch", next);
            return next;
          });
          dragRef.current.y = e.clientY;
          dragRef.current.x = e.clientX;
          return;
        }
        if (!onBrowseDelta) return;
        const now = performance.now();
        if (now < ringBrowseLockUntil.current) return;
        const dragStep = 96;
        if (Math.abs(dx) > dragStep) {
          ringBrowseLockUntil.current = now + 280;
          onBrowseDelta(dx < 0 ? 1 : -1);
          dragRef.current.x = e.clientX;
          dragRef.current.y = e.clientY;
        }
        return;
      }

      if (!onBrowseDelta) return;
      const dragStep = 48;
      if (Math.abs(dx) > dragStep) {
        onBrowseDelta(dx < 0 ? 1 : -1);
        dragRef.current.x = e.clientX;
        dragRef.current.y = e.clientY;
      }
    },
    [onBrowseDelta, layout, wallpaperCount, schedulePersistZoom]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.panning = false;
    dragRef.current.mode = null;
  }, []);

  const overviewZoomDistance = useSelector(
    (state: any) =>
      (state.settings.desktop3dSceneZoomDistance as number | null) ?? null
  );
  const roomScene = fullscreen || usesRoomScene(layout);
  const cardCount = Math.min(
    cards.length,
    roomScene ? getSceneMaxCards() : WALLPAPER_CARD_MAX
  );
  const cam = getCameraTargetForLayout(
    layout,
    roomScene,
    focusedIndex,
    false,
    cardCount,
    overviewZoomDistance,
    ringZoomDistance,
    missionScrollY,
    missionZoomDistance,
    ringViewPitch
  );

  if (!active) return null;

  return (
    <div
      className={className}
      style={style}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{
          position: cam.position,
          fov: cam.fov ?? (roomScene ? 48 : 45),
          near: 0.1,
          far: 120,
        }}
        gl={{
          antialias: true,
          alpha: !roomScene,
          powerPreference: "high-performance",
        }}
        frameloop={frameloop}
        onCreated={({ gl }) => {
          gl.setClearColor(roomScene ? 0x2a3a52 : 0x000000, roomScene ? 1 : 0);
        }}
      >
        <SceneContent
          cards={cards}
          layout={layout}
          focusedIndex={focusedIndex}
          browseOffset={browseOffset}
          onSelect={onSelect}
          onFocusIndex={onFocusIndex}
          active={active}
          fullscreen={roomScene}
          hud={hud}
          ringZoomDistance={ringZoomDistance}
          missionScrollY={missionScrollY}
          missionZoomDistance={missionZoomDistance}
          ringViewPitch={ringViewPitch}
          workspace={workspace}
        />
      </Canvas>
    </div>
  );
}

export default LaunchPad3DStage;
