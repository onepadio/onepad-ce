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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, ContactShadows, OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useDispatch, useSelector } from "react-redux";

import CardMesh from "./CardMesh";
import DeskRoom, { DESK_ROOM } from "./DeskRoom";
import MonitorBank from "./MonitorBank";
import WebViewProjector from "./WebViewProjector";
import { getExperience } from "./experiences/registry";
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
import {
  ARENA_FLOOR_Y,
  getArenaRadius,
  getDeskWorkCamera,
  getSceneFrontIndex,
  dragDeltaToSceneAngle,
  snapSceneAngle,
} from "./layouts/roomScreens";
import { setVisibleSceneWindowIds } from "./sceneVisibility";
import type { LaunchPadCard, Launchpad3dLayoutId } from "./types";
import { persistDesktop3dZoomForWorkspace } from "../../util/desktop3dZooms";
import {
  getSortedTabIdsForWindow,
  switchAppTab,
  switchBrowserTab,
} from "../../util/browserTabGroups";
import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";

/** Soft cap for wallpaper layouts (ring / mission / cover) */
const WALLPAPER_CARD_MAX = 48;

/** True when the pointer is over the focused HUD webview (guest should own scroll). */
function isPointerOverFocusedWebView(
  clientX: number,
  clientY: number,
  frontCardId: string | null
): boolean {
  const hit = document.elementFromPoint(clientX, clientY) as Element | null;
  if (hit) {
    const tag = hit.tagName?.toLowerCase?.() || "";
    if (tag === "webview" || hit.closest?.("webview")) return true;
    if (hit.closest?.("[data-desktop3d-webview]")) return true;
  }
  if (!frontCardId) return false;
  const host = document.querySelector(
    `[data-desktop3d-webview="${frontCardId}"]`
  ) as HTMLElement | null;
  if (!host) return false;
  const r = host.getBoundingClientRect();
  return (
    clientX >= r.left &&
    clientX <= r.right &&
    clientY >= r.top &&
    clientY <= r.bottom
  );
}

function resolveCardWindowId(
  cardId: string | null | undefined,
  openWindows: Record<string, any>,
  activeWindowId: string | null | undefined
): string | null {
  if (!cardId || cardId === "launchpad") return null;
  if (cardId === OTHERS_BROWSER_CARD_ID) {
    if (activeWindowId && openWindows[activeWindowId]?.type === "browser") {
      return activeWindowId;
    }
    return (
      Object.keys(openWindows).find(
        (id) => openWindows[id]?.type === "browser"
      ) || null
    );
  }
  return openWindows[cardId] ? cardId : null;
}

/** Truncate long label text (page title or URL); full value stays in tooltip. */
function formatCardSubtitle(raw: string, maxLen = 48): string {
  const s = (raw || "").trim();
  if (!s) return "";
  // Prefer compact host/path when the subtitle is a bare URL
  if (/^https?:\/\//i.test(s) || /^www\./i.test(s)) {
    try {
      const u = new URL(s.includes("://") ? s : `https://${s}`);
      const host = u.host.replace(/^www\./, "");
      const path = `${u.pathname}${u.search}`.replace(/\/$/, "") || "";
      const full = path && path !== "/" ? `${host}${path}` : host;
      if (full.length <= maxLen) return full;
      return `${full.slice(0, maxLen - 1)}…`;
    } catch {
      /* fall through */
    }
  }
  return s.length <= maxLen ? s : `${s.slice(0, maxLen - 1)}…`;
}

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
  /** Project live DOM webviews onto screen planes */
  projectWebViews?: boolean;
  /** Notify parent when camera zooms to a card (window desktop HUD) */
  onZoomedChange?: (zoomed: boolean, cardId: string | null) => void;
  /** External request to zoom to this card id (dock / session focus) */
  externalZoomCardId?: string | null;
  /** When true, leave focus (overview) */
  externalClearZoom?: boolean;
  /** Esc / click-outside: deactivate the active window (back to launchpad session) */
  onDeactivateFront?: () => void;
  /** Continuous scene ring rotation angle offset from drag (radians) */
  sceneAngleOffset?: number;
  /** Reset scene rotation offset to 0 (called on card select) */
  onResetSceneAngle?: () => void;
  /** Scene active (warm space visible) — pause motion when false */
  sceneActive?: boolean;
  /** Controlled explore mode from parent chrome */
  exploreMode?: boolean;
  onExploreModeChange?: (explore: boolean) => void;
  /** Override experience id (warm space cache) */
  experienceId?: string | null;
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
  sceneAngleOffset = 0,
  clearColor = 0x2a3a52,
  exploreMode = false,
  /** Desk worlds: camera stays seated; screen ring rotates instead */
  fixedDesk = false,
  idleYawAmp = 0.012,
  idlePitchAmp = 0.006,
  idlePeriodSec = 8,
  reducedMotion = false,
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
  sceneAngleOffset?: number;
  clearColor?: number;
  exploreMode?: boolean;
  fixedDesk?: boolean;
  idleYawAmp?: number;
  idlePitchAmp?: number;
  idlePeriodSec?: number;
  reducedMotion?: boolean;
}) {
  const { camera, gl, controls } = useThree();
  const roomScene = usesRoomScene(layout) || !!fullscreen;
  const zoomDistRef = useRef(overviewZoomDistance);
  zoomDistRef.current = overviewZoomDistance;
  // Room scene: drive camera by angle on the ring (never cartesian lerp — that bends walls)
  const roomAngleRef = useRef<number | null>(null);
  const exploreBlendRef = useRef(0);
  const exploreTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    gl.setClearColor(roomScene ? clearColor : 0x000000, roomScene ? 1 : 0);
  }, [gl, roomScene, clearColor]);

  useEffect(() => {
    exploreTweenRef.current?.kill();
    const proxy = { t: exploreBlendRef.current };
    exploreTweenRef.current = gsap.to(proxy, {
      t: exploreMode ? 1 : 0,
      duration: reducedMotion ? 0.01 : 0.75,
      ease: "power2.inOut",
      onUpdate: () => {
        exploreBlendRef.current = proxy.t;
      },
    });
    return () => {
      exploreTweenRef.current?.kill();
    };
  }, [exploreMode, reducedMotion]);

  useEffect(() => {
    // Recenter angle tracking when ring size / mode changes
    roomAngleRef.current = null;
  }, [cardCount, roomScene]);

  useFrame(({ clock }) => {
    if (!active || !roomScene) return;
    const cam = camera as THREE.PerspectiveCamera;
    const orbit = controls as OrbitControlsImpl | null;
    const n = Math.max(cardCount, 1);
    const angleStep = (Math.PI * 2) / n;
    const targetAngle = focusedIndex * angleStep + sceneAngleOffset;

    if (roomAngleRef.current == null) {
      roomAngleRef.current = targetAngle;
    } else if (sceneAngleOffset !== 0) {
      // Drag / key orbit: follow the animated angle exactly (arc motion)
      roomAngleRef.current = targetAngle;
    } else {
      // Settle after snap: shortest arc only (2π → 0 must not rewind through all screens)
      let a = roomAngleRef.current;
      const TWO_PI = Math.PI * 2;
      let delta = targetAngle - a;
      delta = ((delta % TWO_PI) + TWO_PI) % TWO_PI;
      if (delta > Math.PI) delta -= TWO_PI;
      if (Math.abs(delta) < 0.0005) {
        roomAngleRef.current = targetAngle;
      } else {
        roomAngleRef.current = a + delta * 0.22;
      }
    }

    // Desk worlds: stay seated. Control room: orbit with focus.
    const target = fixedDesk
      ? getDeskWorkCamera(cardCount)
      : getCameraTargetForLayout(
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
          ringZoomPhase,
          roomAngleRef.current - focusedIndex * angleStep
        );

    const workPos = new THREE.Vector3(...target.position);
    const workLook = new THREE.Vector3(...target.lookAt);
    // Idle breathe around work pose (disabled in explore / reduced motion)
    if (!reducedMotion && exploreBlendRef.current < 0.05) {
      const t = clock.elapsedTime;
      const period = Math.max(4, idlePeriodSec);
      workPos.x += Math.sin(t * ((Math.PI * 2) / period)) * idleYawAmp * 8;
      workPos.y +=
        Math.cos(t * ((Math.PI * 2) / (period * 1.15))) * idlePitchAmp * 6;
    }

    const expPos = new THREE.Vector3(...DESK_ROOM.exploreCamPos);
    const expLook = new THREE.Vector3(...DESK_ROOM.exploreLookAt);
    // Seat-relative explore: turn around from the fixed desk camera
    if (fixedDesk) {
      const seat = getDeskWorkCamera(cardCount);
      expPos.set(seat.position[0], seat.position[1] + 0.15, seat.position[2]);
      expLook.set(0, seat.lookAt[1], Math.abs(seat.lookAt[2]) + 6);
    }
    const blend = exploreBlendRef.current;
    cam.position.lerpVectors(workPos, expPos, blend);
    const look = new THREE.Vector3().lerpVectors(workLook, expLook, blend);
    cam.lookAt(look);
    const fov = target.fov ?? 56;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    if (orbit) {
      orbit.target.copy(look);
      orbit.update();
    }
  });

  useEffect(() => {
    if (!active || roomScene) return;
    const cam = camera as THREE.PerspectiveCamera;
    const orbit = controls as OrbitControlsImpl | null;
    const duration =
      (layout === "mission" || layout === "ring") && zoomToScreen
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
      ringZoomPhase,
      sceneAngleOffset
    );
    const look = new THREE.Vector3(...target.lookAt);
    const fov = target.fov ?? 45;

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
    sceneAngleOffset,
  ]);

  return null;
}

/**
 * Desk worlds: same continuous-angle settle as control-room camera orbit.
 * Camera stays seated; this lerps the screen carousel toward the focused slot
 * so cold focus jumps (dock / click) ease instead of snapping.
 */
function DeskAngleBridge({
  enabled,
  focusedIndex,
  sceneAngleOffset,
  cardCount,
  onOffset,
}: {
  enabled: boolean;
  focusedIndex: number;
  sceneAngleOffset: number;
  cardCount: number;
  onOffset: (offset: number) => void;
}) {
  const angleRef = useRef<number | null>(null);
  const lastSentRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      angleRef.current = null;
      lastSentRef.current = null;
      onOffset(0);
    }
  }, [enabled, onOffset]);

  useFrame(() => {
    if (!enabled) return;
    const n = Math.max(cardCount, 1);
    const angleStep = (Math.PI * 2) / n;
    const target = focusedIndex * angleStep + sceneAngleOffset;

    if (angleRef.current == null) {
      angleRef.current = target;
    } else if (Math.abs(sceneAngleOffset) > 0.0001) {
      // Drag / key orbit already animates sceneAngleOffset — follow exactly
      angleRef.current = target;
    } else {
      let a = angleRef.current;
      const TWO_PI = Math.PI * 2;
      let delta = target - a;
      delta = ((delta % TWO_PI) + TWO_PI) % TWO_PI;
      if (delta > Math.PI) delta -= TWO_PI;
      if (Math.abs(delta) < 0.0005) {
        angleRef.current = target;
      } else {
        // Same settle rate as control-room CameraRig
        angleRef.current = a + delta * 0.22;
      }
    }

    const next = angleRef.current - focusedIndex * angleStep;
    if (
      lastSentRef.current == null ||
      Math.abs(next - lastSentRef.current) > 0.0002
    ) {
      lastSentRef.current = next;
      onOffset(next);
    }
  });

  return null;
}

/** Keep live webviews mounted for windows near the camera front (+ focused). */
function SceneVisibilityTracker({
  cards,
  focusedIndex,
  cameraZoomed,
}: {
  cards: LaunchPadCard[];
  focusedIndex: number;
  cameraZoomed: boolean;
}) {
  const { camera } = useThree();
  const lastKey = useRef("");

  useFrame(() => {
    const n = cards.length;
    if (n === 0) {
      if (lastKey.current !== "") {
        lastKey.current = "";
        setVisibleSceneWindowIds([]);
      }
      return;
    }
    const front = cameraZoomed
      ? focusedIndex
      : getSceneFrontIndex(n, camera.position.x, camera.position.z);
    // Mount webviews only near the front; projector hides off-front ones
    const radius = cameraZoomed ? 1 : 2;
    const ids: string[] = [];
    for (let d = -radius; d <= radius; d++) {
      const i = ((front + d) % n + n) % n;
      if (cards[i]) ids.push(cards[i].id);
    }
    // Always mount the focused card's webview
    if (cards[focusedIndex] && !ids.includes(cards[focusedIndex].id)) {
      ids.push(cards[focusedIndex].id);
    }
    const key = ids.join("|");
    if (key === lastKey.current) return;
    lastKey.current = key;
    setVisibleSceneWindowIds(ids);
  });

  return null;
}

/**
 * OrbitControls for launchpad scene (non-window) only.
 * Window desktop scene: drag rotation is handled by sceneAngleOffset — no zoom/pan.
 */
function SceneOrbitControls({
  zoomToScreen,
  lookAt,
  cardCount,
  workspace,
  locked = false,
}: {
  zoomToScreen: boolean;
  lookAt: [number, number, number];
  cardCount: number;
  workspace: any;
  /** When true (window desktop): no rotate/zoom — CameraRig owns the view */
  locked?: boolean;
}) {
  const dispatch = useDispatch();
  const { camera } = useThree();
  const radius = getArenaRadius(Math.max(cardCount, 1));
  const maxDist = Math.max(4, radius - 0.85);
  const minDist = zoomToScreen ? 1.6 : 0.2;

  const persistOverviewZoom = useCallback(() => {
    if (locked || zoomToScreen) return;
    const target = new THREE.Vector3(...lookAt);
    const distance = camera.position.distanceTo(target);
    if (!Number.isFinite(distance)) return;
    void persistDesktop3dZoomForWorkspace(
      dispatch,
      workspace,
      "scene",
      distance
    );
  }, [camera, lookAt, zoomToScreen, locked, dispatch, workspace]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableRotate={!locked}
      enableZoom={false}
      enableDamping={!locked}
      dampingFactor={0.08}
      rotateSpeed={0.6}
      minDistance={minDist}
      maxDistance={maxDist}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.72}
      target={lookAt}
      // No dolly/pan; rotate only when unlocked (launchpad). Window desktop uses sceneAngleOffset.
      mouseButtons={
        locked
          ? { LEFT: -1 as THREE.MOUSE, MIDDLE: -1 as THREE.MOUSE, RIGHT: -1 as THREE.MOUSE }
          : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: -1 as THREE.MOUSE, RIGHT: -1 as THREE.MOUSE }
      }
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
  projectWebViews = false,
  onZoomedChange,
  externalZoomCardId = null,
  externalClearZoom = false,
  onDeactivateFront,
  sceneAngleOffset = 0,
  onResetSceneAngle,
  sceneActive = true,
  exploreMode: exploreModeProp = false,
  onExploreModeChange,
  experienceId: experienceIdProp = null,
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
  const experienceIdFromSettings = useSelector(
    (state: any) => state.settings.desktop3dExperience || "control-room"
  );
  const experienceId = experienceIdProp || experienceIdFromSettings;
  const experience = useMemo(
    () => getExperience(experienceId),
    [experienceId]
  );
  const reducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  }, []);
  const [exploreMode, setExploreMode] = useState(!!exploreModeProp);
  const [swapPulse, setSwapPulse] = useState(0);
  const prevFocusedRef = useRef(focusedIndex);

  useEffect(() => {
    setExploreMode(!!exploreModeProp);
  }, [exploreModeProp]);

  const setExplore = useCallback(
    (next: boolean) => {
      setExploreMode(next);
      onExploreModeChange?.(next);
    },
    [onExploreModeChange]
  );

  useEffect(() => {
    if (prevFocusedRef.current === focusedIndex) return;
    prevFocusedRef.current = focusedIndex;
    setSwapPulse(1);
    const t = window.setTimeout(() => setSwapPulse(0), 320);
    return () => window.clearTimeout(t);
  }, [focusedIndex]);

  // Esc exits explore first
  useEffect(() => {
    if (!exploreMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setExplore(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exploreMode, setExplore]);

  const [cameraZoomed, setCameraZoomed] = useState(false);
  /** Window desktop: bring webview to HUD frame without moving the camera */
  const [frontWebViewId, setFrontWebViewId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [ringZoomCardIndex, setRingZoomCardIndex] = useState(-1);
  const [ringZoomPhase, setRingZoomPhase] = useState<
    "approach" | "front" | null
  >(null);
  const activateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** User dismissed this window's front webview — don't auto-reopen from session */
  const dismissedFrontIdRef = useRef<string | null>(null);
  const appliedExternalZoomRef = useRef<string | null>(null);
  /** Ignore card picks right after an outside-click dismiss */
  const suppressSelectUntilRef = useRef(0);
  /** Timestamp when frontWebViewId was last set — ignore outside-click within 600ms */
  const frontWebViewOpenedAtRef = useRef(0);
  const frontWebViewIdRef = useRef<string | null>(null);
  frontWebViewIdRef.current = frontWebViewId;

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

  const leaveZoom = useCallback(() => {
    clearActivateTimer();
    if (projectWebViews && frontWebViewIdRef.current) {
      dismissedFrontIdRef.current = frontWebViewIdRef.current;
    }
    setCameraZoomed(false);
    setFrontWebViewId(null);
    setRingZoomCardIndex(-1);
    setRingZoomPhase(null);
  }, [clearActivateTimer, projectWebViews]);

  /** User dismiss: clear front frame + deactivate the app in session */
  const dismissFrontAndDeactivate = useCallback(() => {
    leaveZoom();
    if (projectWebViews) {
      onDeactivateFront?.();
    }
  }, [leaveZoom, projectWebViews, onDeactivateFront]);

  // Reset zoom / hover when layout mode changes
  useEffect(() => {
    dismissedFrontIdRef.current = null;
    appliedExternalZoomRef.current = null;
    leaveZoom();
    setHoveredIndex(-1);
  }, [roomScene, layout, leaveZoom]);

  useEffect(() => {
    return () => clearActivateTimer();
  }, [clearActivateTimer]);

  const zoomedCardId = projectWebViews
    ? frontWebViewId
    : cameraZoomed && limited[focusedIndex]
      ? limited[focusedIndex].id
      : cameraZoomed && ringZoomCardIndex >= 0
        ? limited[ringZoomCardIndex]?.id ?? null
        : null;

  // In scene overview (no card expanded): show focused card's webview on the wall.
  // When a card is expanded (frontWebViewId set), hide the wall webview — HUD overlay takes over.
  const sceneFocusedCardId =
    roomScene && projectWebViews && !frontWebViewId && limited[focusedIndex]?.hasLiveTab
      ? limited[focusedIndex].id
      : null;

  // HUD-focused only when a window is expanded to the front overlay (not wall overview)
  const windowFrontActive = projectWebViews && !!frontWebViewId;

  useEffect(() => {
    onZoomedChange?.(
      projectWebViews ? windowFrontActive : cameraZoomed,
      zoomedCardId
    );
  }, [
    cameraZoomed,
    windowFrontActive,
    zoomedCardId,
    onZoomedChange,
    projectWebViews,
  ]);

  // Dock / session: orbit camera to face active window + dolly in so webview is large
  useEffect(() => {
    if (!projectWebViews) return;
    if (!externalZoomCardId) {
      appliedExternalZoomRef.current = null;
      return;
    }
    if (appliedExternalZoomRef.current === externalZoomCardId) return;

    const i = cards.findIndex((c) => c.id === externalZoomCardId);
    if (i < 0) return;

    appliedExternalZoomRef.current = externalZoomCardId;
    dismissedFrontIdRef.current = null;
    clearActivateTimer();
    onFocusIndex(i);
    setHoveredIndex(i);
    // Expand webview to HUD overlay (same as clicking the card)
    if (roomScene && projectWebViews) {
      frontWebViewOpenedAtRef.current = performance.now();
      setFrontWebViewId(externalZoomCardId);
    }
    // No dolly in scene mode — camera stays at fixed OVERVIEW_DIST from wall
  }, [
    externalZoomCardId,
    projectWebViews,
    roomScene,
    cards,
    onFocusIndex,
    clearActivateTimer,
  ]);

  useEffect(() => {
    if (!externalClearZoom) return;
    leaveZoom();
  }, [externalClearZoom, leaveZoom]);

  // Keyboard / drag browse moved focus off the expanded window → return to overview
  useEffect(() => {
    if (!projectWebViews || !frontWebViewId) return;
    const focused = limited[focusedIndex];
    if (focused && focused.id !== frontWebViewId) {
      leaveZoom();
    }
  }, [
    focusedIndex,
    frontWebViewId,
    limited,
    projectWebViews,
    leaveZoom,
  ]);

  // Click outside the front webview → dismiss (dock / HUD stay interactive)
  useEffect(() => {
    if (!projectWebViews || !frontWebViewId) return;
    const onPointerDown = (e: PointerEvent) => {
      // Ignore the same click that opened the HUD frame
      if (performance.now() - frontWebViewOpenedAtRef.current < 600) return;
      const target = e.target as Element | null;
      if (!target) return;
      const host = document.querySelector(
        `[data-desktop3d-webview="${frontWebViewId}"]`
      );
      if (host?.contains(target)) return;
      // Keep chrome interactive: dock, HUD, vertical tab bar, browser switcher, etc.
      if (
        target.closest?.(
          [
            ".apps-overlay-menu",
            ".apps-overlay-trigger-indicator",
            ".desktop-3d-overlay-top",
            ".desktop-top-controls",
            ".desktop-3d-chrome",
            ".desktop-3d-experience-picker",
            ".desktop-3d-launchpad-overlay",
            ".desktop-3d-tab-dots",
            "#vertical-tab-bar",
            "#vertical-tab-bar-overlay",
            "#vertical-tab-bar-trigger",
            ".vertical-tab-bar-trigger-zone",
            ".browser-tab-switcher-panel",
            ".browser-tab-switcher-backdrop",
            ".app-tab-switcher-panel",
            ".builtin-apps-switcher-panel",
            ".shared-apps-switcher-panel",
          ].join(", ")
        )
      ) {
        return;
      }
      // Prevent the same click from re-selecting the card under the cursor
      suppressSelectUntilRef.current = performance.now() + 450;
      dismissFrontAndDeactivate();
      e.stopPropagation();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [projectWebViews, frontWebViewId, dismissFrontAndDeactivate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (projectWebViews) {
        e.preventDefault();
        if (roomScene) {
          // Scene: just pull camera back to overview, don't deactivate app
          leaveZoom();
        } else {
          dismissFrontAndDeactivate();
        }
        return;
      }
      if (!cameraZoomed) return;
      if (!roomScene && layout !== "mission" && layout !== "ring") return;
      e.preventDefault();
      leaveZoom();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    roomScene,
    layout,
    cameraZoomed,
    leaveZoom,
    projectWebViews,
    dismissFrontAndDeactivate,
  ]);

  const handleCardSelect = useCallback(
    (id: string) => {
      if (performance.now() < suppressSelectUntilRef.current) return;

      const i = limited.findIndex((c) => c.id === id);
      if (i < 0) return;

      // Window Scene: bring card to the desk front, then expand webview to HUD
      if (roomScene && projectWebViews) {
        dismissedFrontIdRef.current = null;
        appliedExternalZoomRef.current = id;
        clearActivateTimer();
        onFocusIndex(i);
        setHoveredIndex(i);
        onResetSceneAngle?.();
        const openHud = () => {
          frontWebViewOpenedAtRef.current = performance.now();
          setFrontWebViewId(id);
          onSelect(id);
        };
        // Desk worlds: wait a frame so the ring has snapped to front and the
        // projector caches the seated pose — otherwise the webview flies in
        // from the previous slot and order looks mixed.
        if (experience.usesDeskRoom !== false) {
          requestAnimationFrame(() => requestAnimationFrame(openHud));
        } else {
          openHud();
        }
        return;
      }

      // Scene (launchpad): zoom to icon, then activate
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
      projectWebViews,
      frontWebViewId,
      experience.usesDeskRoom,
      onResetSceneAngle,
    ]
  );

  const frontWebViewIndex = frontWebViewId
    ? limited.findIndex((c) => c.id === frontWebViewId)
    : -1;

  const highlightIndex =
    projectWebViews && frontWebViewIndex >= 0
      ? frontWebViewIndex
      : roomScene && cameraZoomed
        ? focusedIndex
        : (layout === "mission" || layout === "ring") &&
            cameraZoomed &&
            ringZoomCardIndex >= 0
          ? ringZoomCardIndex
          : hoveredIndex >= 0
            ? hoveredIndex
            : focusedIndex;

  // When a card is clicked in any layout, expand it to HUD overlay
  const interactiveWebViewId = projectWebViews ? frontWebViewId : null;

  // Scene+projectWebViews: camera stays at OVERVIEW_DIST — no dolly ever
  // Other layouts: dolly when cameraZoomed
  const zoomToIcon =
    !projectWebViews &&
    (roomScene || layout === "mission" || layout === "ring") &&
    cameraZoomed;

  const deskFixed = experience.usesDeskRoom !== false;
  const [deskVisualOffset, setDeskVisualOffset] = useState(0);
  const onDeskVisualOffset = useCallback((offset: number) => {
    setDeskVisualOffset(offset);
  }, []);
  // Desk uses continuous-angle settle; control room uses sceneAngleOffset on the camera
  const deskPoseOffset =
    deskFixed && roomScene ? deskVisualOffset : sceneAngleOffset;
  const cameraLookAt = useMemo((): [number, number, number] => {
    if (deskFixed && roomScene) {
      return getDeskWorkCamera(limited.length).lookAt;
    }
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
      ringZoomPhase,
      sceneAngleOffset
    );
    return t.lookAt;
  }, [
    deskFixed,
    layout,
    roomScene,
    focusedIndex,
    zoomToIcon,
    sceneAngleOffset,
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
        active={active && sceneActive}
        fullscreen={roomScene}
        focusedIndex={focusedIndex}
        zoomToScreen={zoomToIcon}
        cardCount={limited.length}
        overviewZoomDistance={projectWebViews ? null : overviewZoomDistance}
        ringZoomDistance={ringZoomDistance}
        missionScrollY={missionScrollY}
        missionZoomDistance={missionZoomDistance}
        ringViewPitch={ringViewPitch}
        browseOffset={browseOffset}
        ringZoomCardIndex={ringZoomCardIndex}
        ringZoomPhase={ringZoomPhase}
        sceneAngleOffset={sceneAngleOffset}
        clearColor={experience.clearColor}
        exploreMode={exploreMode}
        fixedDesk={experience.usesDeskRoom !== false}
        idleYawAmp={experience.motion?.idleYawAmp}
        idlePitchAmp={experience.motion?.idlePitchAmp}
        idlePeriodSec={experience.motion?.idlePeriodSec}
        reducedMotion={!!reducedMotion}
      />
      <DeskAngleBridge
        enabled={deskFixed && roomScene && active && sceneActive}
        focusedIndex={focusedIndex}
        sceneAngleOffset={sceneAngleOffset}
        cardCount={limited.length}
        onOffset={onDeskVisualOffset}
      />
      {roomScene && (
        <SceneOrbitControls
          zoomToScreen={!projectWebViews && cameraZoomed}
          lookAt={cameraLookAt}
          cardCount={limited.length}
          workspace={workspace}
          locked={!!projectWebViews || exploreMode}
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
          {experience.usesDeskRoom !== false && (
            <DeskRoom
              count={limited.length}
              exploreMode={exploreMode}
              swapPulse={swapPulse}
              active={active && sceneActive}
              experienceId={experience.id}
            />
          )}
          {(() => {
            const Vista = experience.Vista;
            return (
              <Vista
                count={limited.length}
                active={active && sceneActive}
              />
            );
          })()}
          {/* Soft contact shadows look like a transparent blur on the desk surface */}
          {!deskFixed && (
            <ContactShadows
              position={[0, ARENA_FLOOR_Y + 0.02, 0]}
              opacity={0.55}
              scale={getArenaRadius(limited.length) * 2.4}
              blur={2.2}
              far={14}
            />
          )}
          {/* Floor click returns to overview / exits explore */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, ARENA_FLOOR_Y + 0.03, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (exploreMode) {
                setExplore(false);
                return;
              }
              leaveZoom();
              setHoveredIndex(-1);
            }}
          >
            <circleGeometry args={[getArenaRadius(limited.length) + 1.5, 48]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      {roomScene && <SceneHud hud={hud} />}
      {projectWebViews && (
        <>
          <SceneVisibilityTracker
            cards={limited}
            focusedIndex={
              frontWebViewIndex >= 0 ? frontWebViewIndex : focusedIndex
            }
            cameraZoomed={windowFrontActive}
          />
          <WebViewProjector
            interactiveId={interactiveWebViewId}
            sceneFocusedId={sceneFocusedCardId}
          />
        </>
      )}

      <group>
        {roomScene && !deskFixed ? (
          <MonitorBank
            count={limited.length}
            focusedIndex={
              projectWebViews
                ? frontWebViewIndex >= 0
                  ? frontWebViewIndex
                  : focusedIndex
                : cameraZoomed
                  ? focusedIndex
                  : focusedIndex
            }
            hoveredIndex={hoveredIndex}
          />
        ) : null}
        {limited.map((card, index) => {
          const pose = computeCardPose(layout, {
            index,
            count: limited.length,
            focusedIndex,
            browseOffset,
            deskFixed: deskFixed && roomScene,
            sceneAngleOffset: deskFixed && roomScene ? deskPoseOffset : 0,
          });
          // Desk: skip invisible neighbors so they can't steal order / depth
          if (deskFixed && roomScene && pose.opacity < 0.05) {
            return null;
          }
          const focused = index === highlightIndex;
          return (
            <group key={card.id}>
              <CardMesh
                card={card}
                pose={pose}
                focused={focused}
                variant={roomScene ? "screen" : "card"}
                moveDuration={
                  deskFixed && roomScene
                    ? 0
                    : layout === "ring"
                      ? 0.85
                      : undefined
                }
                blockStageDrag={layout === "mission"}
                projectWebView={
                  projectWebViews && !!card.hasLiveTab
                }
                contentTransparent={
                  projectWebViews &&
                  !!card.hasLiveTab &&
                  (card.id === interactiveWebViewId ||
                    card.id === sceneFocusedCardId ||
                    (deskFixed &&
                      roomScene &&
                      index === focusedIndex))
                }
                onSelect={handleCardSelect}
                onFocus={(id) => {
                  const i = limited.findIndex((c) => c.id === id);
                  if (i < 0) return;
                  if (layout === "mission") {
                    setHoveredIndex(i);
                    return;
                  }
                  if (roomScene) {
                    setHoveredIndex(i);
                    return;
                  }
                  if (layout === "ring" && cameraZoomed) {
                    setHoveredIndex(i);
                    return;
                  }
                  setHoveredIndex(i);
                  onFocusIndex(i);
                }}
                onBlur={() => setHoveredIndex(-1)}
              />
              {index === highlightIndex && (() => {
                const contentHalf = 1.5 / 2;
                const gap = 0.18;
                const yOff = contentHalf * pose.scale + gap * pose.scale;
                return (
                  <Html
                    position={[
                      pose.position[0],
                      pose.position[1] - yOff,
                      pose.position[2] + (roomScene ? 0.08 : 0.15),
                    ]}
                    distanceFactor={
                      roomScene
                        ? cameraZoomed
                          ? 6
                          : 8
                        : cameraZoomed
                          ? 5.5
                          : 8
                    }
                    style={{
                      pointerEvents: "none",
                      userSelect: "none",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="launchpad-3d-card-label">
                      <div
                        className="launchpad-3d-card-title"
                        title={card.title}
                      >
                        {card.title}
                      </div>
                      {card.subtitle ? (
                        <div
                          className="launchpad-3d-card-subtitle"
                          title={card.subtitle}
                        >
                          {formatCardSubtitle(card.subtitle)}
                        </div>
                      ) : null}
                    </div>
                  </Html>
                );
              })()}
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
  projectWebViews?: boolean;
  onZoomedChange?: (zoomed: boolean, cardId: string | null) => void;
  externalZoomCardId?: string | null;
  externalClearZoom?: boolean;
  onDeactivateFront?: () => void;
  /** When false (warm space hidden), pause WebGL frameloop */
  sceneActive?: boolean;
  exploreMode?: boolean;
  onExploreModeChange?: (explore: boolean) => void;
  experienceId?: string | null;
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
  projectWebViews = false,
  onZoomedChange,
  externalZoomCardId = null,
  externalClearZoom = false,
  onDeactivateFront,
  sceneActive = true,
  exploreMode = false,
  onExploreModeChange,
  experienceId = null,
}: LaunchPad3DStageProps) {
  const dispatch = useDispatch();
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const workspaceId = workspace?.id;
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
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
  const sceneWheelSnapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** HUD-focused window (webview expanded) — wheel switches tabs instead of orbiting */
  const windowFrontActiveRef = useRef(false);
  const frontCardIdRef = useRef<string | null>(null);
  const tabWheelAccum = useRef(0);
  const tabWheelLockUntil = useRef(0);
  /** Continuous scene ring rotation offset in radians (drag → smooth, release → snap) */
  const [sceneAngleOffset, setSceneAngleOffset] = useState(0);
  const sceneAngleOffsetRef = useRef(0);
  sceneAngleOffsetRef.current = sceneAngleOffset;
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  const sceneKeyOrbitTweenRef = useRef<gsap.core.Tween | null>(null);

  const notifyZoomedChange = useCallback(
    (zoomed: boolean, cardId: string | null) => {
      windowFrontActiveRef.current = zoomed;
      frontCardIdRef.current = zoomed ? cardId : null;
      if (!zoomed) {
        tabWheelAccum.current = 0;
        tabWheelLockUntil.current = 0;
      }
      onZoomedChange?.(zoomed, cardId);
    },
    [onZoomedChange]
  );

  const cycleFocusedWindowTab = useCallback(
    (dir: 1 | -1) => {
      const cardId =
        frontCardIdRef.current || cards[focusedIndexRef.current]?.id || null;
      const windowId = resolveCardWindowId(
        cardId,
        openWindows,
        activeWindowId
      );
      if (!windowId || !openWindows[windowId]) return false;
      const tabIds = getSortedTabIdsForWindow(windowId, windowTabs, openTabs);
      if (tabIds.length <= 1) return false;
      const currentId =
        activeTabId && tabIds.includes(activeTabId)
          ? activeTabId
          : activeTabs?.[windowId] || tabIds[0];
      let idx = tabIds.indexOf(currentId);
      if (idx < 0) idx = 0;
      const nextId = tabIds[(idx + dir + tabIds.length) % tabIds.length];
      const tab = openTabs[nextId];
      if (!tab) return false;
      const win = openWindows[windowId];
      if (win?.type === "browser") {
        switchBrowserTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
      } else {
        switchAppTab(tab, dispatch, openWindows, activeTabs, activeWindowId);
      }
      return true;
    },
    [
      cards,
      openWindows,
      activeWindowId,
      windowTabs,
      openTabs,
      activeTabId,
      activeTabs,
      dispatch,
    ]
  );
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
      // Scene: trackpad/wheel smoothly rotates camera; stops → snap to nearest card
      if (layout === "scene") {
        // HUD-focused: tab switching is handled by the window wheel listener
        if (windowFrontActiveRef.current) return;
        const n = cards.length;
        if (n <= 1) return;
        const rawDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        if (Math.abs(rawDelta) < 4) return;
        const angle = dragDeltaToSceneAngle(rawDelta, n, window.innerWidth);
        setSceneAngleOffset((prev) => prev + angle);
        // Restart snap timer on each wheel tick
        if (sceneWheelSnapTimer.current) clearTimeout(sceneWheelSnapTimer.current);
        sceneWheelSnapTimer.current = setTimeout(() => {
          sceneWheelSnapTimer.current = null;
          setSceneAngleOffset((cur) => {
            const { index } = snapSceneAngle(focusedIndex, cur, n);
            onFocusIndex(index);
            return 0;
          });
        }, 200);
        return;
      }
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
    [onBrowseDelta, layout, wallpaperCount, schedulePersistZoom, cards, focusedIndex, onFocusIndex]
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
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;

      // Scene: horizontal drag smoothly rotates the camera around the ring
      if (layout === "scene") {
        if (!dragRef.current.panning) {
          if (Math.abs(dx) < 8) return;
          dragRef.current.panning = true;
          dragRef.current.x = e.clientX;
          return;
        }
        // Accumulate continuous angle offset — camera follows finger without jumping
        const angle = dragDeltaToSceneAngle(dx, cards.length, window.innerWidth);
        setSceneAngleOffset((prev) => prev + angle);
        dragRef.current.x = e.clientX;
        dragRef.current.y = e.clientY;
        return;
      }

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
    [onBrowseDelta, layout, wallpaperCount, schedulePersistZoom, cards, focusedIndex, onFocusIndex]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
    dragRef.current.panning = false;
    dragRef.current.mode = null;
    // Scene: snap accumulated angle offset to nearest card, then reset offset to 0
    if (layout === "scene" && sceneAngleOffset !== 0) {
      const { index } = snapSceneAngle(focusedIndex, sceneAngleOffset, cards.length);
      onFocusIndex(index);
      setSceneAngleOffset(0);
    }
  }, [layout, sceneAngleOffset, focusedIndex, cards.length, onFocusIndex]);

  // ←/→ orbit screens; ↑/↓ cycle tabs in the active window
  useEffect(() => {
    if (layout !== "scene" && !fullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isOrbit = e.key === "ArrowLeft" || e.key === "ArrowRight";
      const isTab = e.key === "ArrowUp" || e.key === "ArrowDown";
      if (!isOrbit && !isTab) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(
          "input, textarea, select, [contenteditable='true'], webview, .desktop-3d-address-bar"
        )
      ) {
        return;
      }

      if (isTab) {
        const dir = e.key === "ArrowDown" ? 1 : -1;
        if (cycleFocusedWindowTab(dir)) e.preventDefault();
        return;
      }

      if (e.repeat) return;
      const n = cards.length;
      if (n <= 1) return;
      e.preventDefault();

      // ArrowRight → next screen; ArrowLeft → previous
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const angleStep = (Math.PI * 2) / n;
      sceneKeyOrbitTweenRef.current?.kill();

      const start = sceneAngleOffsetRef.current;
      const end = start + dir * angleStep;
      const proxy = { a: start };
      sceneKeyOrbitTweenRef.current = gsap.to(proxy, {
        a: end,
        duration: 0.48,
        ease: "power2.inOut",
        onUpdate: () => setSceneAngleOffset(proxy.a),
        onComplete: () => {
          sceneKeyOrbitTweenRef.current = null;
          const { index } = snapSceneAngle(
            focusedIndexRef.current,
            proxy.a,
            n
          );
          onFocusIndex(index);
          setSceneAngleOffset(0);
        },
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      sceneKeyOrbitTweenRef.current?.kill();
      sceneKeyOrbitTweenRef.current = null;
    };
  }, [layout, fullscreen, cards, onFocusIndex, cycleFocusedWindowTab]);

  // Focused window: wheel outside webview jumps tabs (webview keeps its own scroll)
  useEffect(() => {
    if (!projectWebViews) return;
    if (layout !== "scene" && !fullscreen) return;

    const onWheel = (e: globalThis.WheelEvent) => {
      if (!windowFrontActiveRef.current) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.closest?.(
          "input, textarea, select, [contenteditable='true'], .desktop-3d-address-bar"
        )
      ) {
        return;
      }

      if (
        isPointerOverFocusedWebView(
          e.clientX,
          e.clientY,
          frontCardIdRef.current
        )
      ) {
        return;
      }

      // Prefer vertical scroll; ignore tiny trackpad noise
      const delta =
        Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 2) return;

      e.preventDefault();
      e.stopPropagation();

      const now = performance.now();
      if (now < tabWheelLockUntil.current) {
        tabWheelAccum.current = 0;
        return;
      }

      tabWheelAccum.current += delta;
      const threshold = 48;
      if (Math.abs(tabWheelAccum.current) < threshold) return;

      const dir = tabWheelAccum.current > 0 ? 1 : -1;
      tabWheelAccum.current = 0;
      if (cycleFocusedWindowTab(dir)) {
        tabWheelLockUntil.current = now + 260;
      }
    };

    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => window.removeEventListener("wheel", onWheel, true);
  }, [projectWebViews, layout, fullscreen, cycleFocusedWindowTab]);

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
    ringViewPitch,
    null,
    0,
    null,
    sceneAngleOffset
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
        frameloop={sceneActive ? frameloop : "never"}
        onCreated={({ gl }) => {
          const exp = getExperience(
            // read once at create; CameraRig updates live
            undefined
          );
          gl.setClearColor(
            roomScene ? exp.clearColor : 0x000000,
            roomScene ? 1 : 0
          );
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
          projectWebViews={projectWebViews}
          onZoomedChange={notifyZoomedChange}
          externalZoomCardId={externalZoomCardId}
          externalClearZoom={externalClearZoom}
          onDeactivateFront={onDeactivateFront}
          sceneAngleOffset={sceneAngleOffset}
          onResetSceneAngle={() => setSceneAngleOffset(0)}
          sceneActive={sceneActive}
          exploreMode={exploreMode}
          onExploreModeChange={onExploreModeChange}
          experienceId={experienceId}
        />
      </Canvas>
    </div>
  );
}

export default LaunchPad3DStage;
