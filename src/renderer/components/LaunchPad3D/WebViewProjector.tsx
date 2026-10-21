import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { getRegisteredPlanes } from "./planeRegistry";
import {
  DESK_SCREEN_PLATE_H,
  DESK_SCREEN_PLATE_W,
} from "./layouts/roomScreens";

/** Match DeskRoom / CardMesh plate exactly — fill the bezel opening. */
const PLANE_W = DESK_SCREEN_PLATE_W;
const PLANE_H = DESK_SCREEN_PLATE_H;

/** Room above webview for floating address bar + gap */
const FOCUS_TOP_INSET = 100;
/** Leave room for AppsOverlayMenu dock */
const FOCUS_BOTTOM_INSET = 78;
const FOCUS_SIDE_INSET = 56;
/** Slightly smaller than full band so window feels inset in the scene */
const FOCUS_HEIGHT_FILL = 0.96;
const FOCUS_ASPECT = 16 / 10;

/**
 * Native resolution at which every webview always renders on the wall.
 * The outer host div is scaled DOWN via CSS scale() to fit the wall card.
 * NOTE: scale() is safe with Electron <webview> — only rotate/matrix3d blank it.
 */
const NATIVE_W = 1280;
const NATIVE_H = 800;
const FOCUS_ANIM_MS = 420;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();

type RectPose = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type FocusAnim = {
  id: string;
  from: RectPose;
  to: RectPose;
  startedAt: number;
  duration: number;
  reversing: boolean;
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(from: RectPose, to: RectPose, t: number): RectPose {
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  };
}

function projectCorner(
  localX: number,
  localY: number,
  object: THREE.Object3D,
  camera: THREE.Camera,
  canvasW: number,
  canvasH: number,
  canvasLeft: number,
  canvasTop: number,
  out: THREE.Vector3
): { x: number; y: number } | null {
  out.set(localX, localY, 0.002);
  object.localToWorld(out);
  out.project(camera);
  if (out.z > 1 || !Number.isFinite(out.x) || !Number.isFinite(out.y)) {
    return null;
  }
  return {
    x: (out.x * 0.5 + 0.5) * canvasW + canvasLeft,
    y: (-out.y * 0.5 + 0.5) * canvasH + canvasTop,
  };
}

/** Focus frame in coords relative to `.desktop-3d-fullscreen`. */
export function getFocusFramePose(originLeft = 0, originTop = 0): RectPose {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bandTop = FOCUS_TOP_INSET;
  const bandBottom = FOCUS_BOTTOM_INSET;
  const bandH = Math.max(180, vh - bandTop - bandBottom);
  const bandW = Math.max(280, vw - FOCUS_SIDE_INSET * 2);

  let height = bandH * FOCUS_HEIGHT_FILL;
  let width = height * FOCUS_ASPECT;
  if (width > bandW) {
    width = bandW;
    height = width / FOCUS_ASPECT;
  }

  return {
    left: (vw - width) / 2 - originLeft,
    top: bandTop + (bandH - height) / 2 - originTop,
    width,
    height,
  };
}

export function getDesktopOrigin(): { left: number; top: number } {
  // Prefer the active warm space — comma selectors match document order, so a
  // generic `.desktop-3d-fullscreen` would hit a hidden keep-alive first.
  const root =
    (document.querySelector(
      ".space-desktop-warm-layer.is-active .desktop-3d-fullscreen"
    ) as HTMLElement | null) ||
    (document.querySelector(
      ".desktop-3d-fullscreen:not(.desktop-3d-scene-paused)"
    ) as HTMLElement | null) ||
    (document.querySelector(".desktop-3d-fullscreen") as HTMLElement | null);
  if (!root) return { left: 0, top: 0 };
  const r = root.getBoundingClientRect();
  return { left: r.left, top: r.top };
}

function getProjectedPose(
  object: THREE.Object3D,
  camera: THREE.Camera,
  canvasW: number,
  canvasH: number,
  canvasLeft: number,
  canvasTop: number
): RectPose | null {
  const hw = PLANE_W / 2;
  const hh = PLANE_H / 2;
  object.updateWorldMatrix(true, false);

  const tl = projectCorner(
    -hw,
    hh,
    object,
    camera,
    canvasW,
    canvasH,
    canvasLeft,
    canvasTop,
    _a
  );
  const tr = projectCorner(
    hw,
    hh,
    object,
    camera,
    canvasW,
    canvasH,
    canvasLeft,
    canvasTop,
    _b
  );
  const br = projectCorner(
    hw,
    -hh,
    object,
    camera,
    canvasW,
    canvasH,
    canvasLeft,
    canvasTop,
    _c
  );
  const bl = projectCorner(
    -hw,
    -hh,
    object,
    camera,
    canvasW,
    canvasH,
    canvasLeft,
    canvasTop,
    _d
  );
  if (!tl || !tr || !br || !bl) return null;

  const left = Math.min(tl.x, tr.x, br.x, bl.x);
  const right = Math.max(tl.x, tr.x, br.x, bl.x);
  const top = Math.min(tl.y, tr.y, br.y, bl.y);
  const bottom = Math.max(tl.y, tr.y, br.y, bl.y);
  const width = right - left;
  const height = bottom - top;
  if (width < 8 || height < 8) return null;

  return { left, top, width, height };
}

/**
 * Apply position + size to the host div.
 *
 * For wall cards (projected = true):
 *   - Outer div is positioned at card screen location, sized to native resolution
 *   - CSS scale() shrinks it to match projected card size
 * For HUD overlay (projected = false):
 *   - Outer div is sized directly to pose (full resolution)
 */
function setHostAndWebViewOpacity(el: HTMLElement, opacity: number) {
  const o = String(opacity);
  el.style.opacity = o;
  // Electron <webview> is a separate compositor — parent opacity alone often
  // does nothing; set it on the guest nodes too.
  el.querySelectorAll("webview, .webview").forEach((node) => {
    (node as HTMLElement).style.opacity = o;
  });
}

function setWebViewPointerEvents(el: HTMLElement, enabled: boolean) {
  const pe = enabled ? "auto" : "none";
  el.querySelectorAll("webview, .webview").forEach((node) => {
    (node as HTMLElement).style.pointerEvents = pe;
  });
}

function applyPose(
  el: HTMLElement,
  pose: RectPose,
  opts: {
    interactive: boolean;
    elevating: boolean;
    projected?: boolean;
    opacity?: number;
  }
) {
  const opacity =
    opts.opacity != null && Number.isFinite(opts.opacity) ? opts.opacity : 1;
  el.style.visibility = "visible";
  setHostAndWebViewOpacity(el, opacity);
  el.style.position = "absolute";
  el.style.margin = "0";
  el.style.padding = "0";
  el.style.border = "none";
  el.style.overflow = "hidden";
  el.style.borderRadius = opts.interactive || opts.elevating ? "10px" : "14px";
  // No wall-card shadow — it reads as overflow past the monitor bezel.
  el.style.boxShadow =
    opts.interactive || opts.elevating
      ? "0 16px 48px rgba(0, 0, 0, 0.55)"
      : "none";
  // Projected overview: host catches clicks (via click-shield) so Electron
  // <webview> guests can't steal them from the 3D card underneath.
  const projectedCatch = !!opts.projected && !opts.interactive;
  el.style.pointerEvents =
    opts.interactive || projectedCatch ? "auto" : "none";
  el.style.zIndex = opts.interactive || opts.elevating ? "20" : "10";
  el.classList.toggle("is-interactive", !!opts.interactive);
  el.classList.toggle("is-projected", projectedCatch);
  setWebViewPointerEvents(el, !!opts.interactive);
  // Solid host fill kills see-through; clear it for translucent wall cards.
  el.style.background =
    opts.projected && opacity < 0.999 ? "transparent" : "#0d1118";

  if (opts.projected) {
    const scaleX = pose.width / NATIVE_W;
    const scaleY = pose.height / NATIVE_H;
    el.style.left = `${pose.left}px`;
    el.style.top = `${pose.top}px`;
    el.style.width = `${NATIVE_W}px`;
    el.style.height = `${NATIVE_H}px`;
    el.style.transformOrigin = "0 0";
    el.style.transform = `scale(${scaleX}, ${scaleY})`;
    el.style.overflow = "hidden";
  } else {
    el.style.left = `${pose.left}px`;
    el.style.top = `${pose.top}px`;
    el.style.width = `${Math.max(1, pose.width)}px`;
    el.style.height = `${Math.max(1, pose.height)}px`;
    el.style.transform = "none";
    el.style.transformOrigin = "0 0";
  }
}

function hidePose(el: HTMLElement) {
  el.style.visibility = "hidden";
  el.style.pointerEvents = "none";
  setHostAndWebViewOpacity(el, 0);
  setWebViewPointerEvents(el, false);
  el.classList.remove("is-interactive");
  el.classList.remove("is-projected");
}

function WebViewProjector({
  interactiveId = null,
  sceneFocusedId = null,
  sceneActive = true,
  projectNeighbors = false,
  focusedOpacity = 0.7,
  unfocusedOpacity = 0.7,
}: {
  interactiveId?: string | null;
  /** Show this card's webview at its ring-card position (no HUD zoom). */
  sceneFocusedId?: string | null;
  /** Warm keep-alive: paused scenes must not move/hide shared webview hosts */
  sceneActive?: boolean;
  /**
   * Desk worlds: also project other registered wall webviews (see-through).
   * Overview (projected) uses 0.7; HUD interactive stays 1.
   */
  projectNeighbors?: boolean;
  focusedOpacity?: number;
  unfocusedOpacity?: number;
}) {
  const { camera, gl } = useThree();
  const lastPoses = useRef(new Map<string, RectPose>());
  const animRef = useRef<FocusAnim | null>(null);
  const prevInteractive = useRef<string | null>(null);

  useEffect(() => {
    if (!sceneActive) return;
    const prev = prevInteractive.current;
    prevInteractive.current = interactiveId;
    const { left: ox, top: oy } = getDesktopOrigin();

    if (interactiveId && interactiveId !== prev) {
      const from =
        lastPoses.current.get(interactiveId) || getFocusFramePose(ox, oy);
      animRef.current = {
        id: interactiveId,
        from,
        to: getFocusFramePose(ox, oy),
        startedAt: performance.now(),
        duration: FOCUS_ANIM_MS,
        reversing: false,
      };
      return;
    }

    if (!interactiveId && prev) {
      const to = lastPoses.current.get(prev) || getFocusFramePose(ox, oy);
      animRef.current = {
        id: prev,
        from: getFocusFramePose(ox, oy),
        to,
        startedAt: performance.now(),
        duration: FOCUS_ANIM_MS * 0.85,
        reversing: true,
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactiveId, sceneFocusedId, sceneActive]);

  useFrame(() => {
    // Inactive warm spaces keep a Canvas mounted; never touch hosts belonging
    // to the visible space (shared [data-desktop3d-webview] nodes).
    if (!sceneActive) return;
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const canvasW = rect.width;
    const canvasH = rect.height;
    const now = performance.now();
    const anim = animRef.current;
    const { left: originLeft, top: originTop } = getDesktopOrigin();
    const planes = getRegisteredPlanes();

    // Update cached projections for registered planes
    planes.forEach((object, id) => {
      const projectedRaw = getProjectedPose(
        object,
        camera,
        canvasW,
        canvasH,
        rect.left,
        rect.top
      );
      if (!projectedRaw) return;
      lastPoses.current.set(id, {
        left: projectedRaw.left - originLeft,
        top: projectedRaw.top - originTop,
        width: projectedRaw.width,
        height: projectedRaw.height,
      });
    });

    // Visit hosts in the active warm desktop only — keep-alive layers can
    // still have leftover nodes while their Canvas frameloop is paused.
    const activeRoot =
      (document.querySelector(
        ".space-desktop-warm-layer.is-active .desktop-3d-fullscreen"
      ) as HTMLElement | null) ||
      (document.querySelector(
        ".desktop-3d-fullscreen:not(.desktop-3d-scene-paused)"
      ) as HTMLElement | null);
    const hosts = (activeRoot || document).querySelectorAll(
      "[data-desktop3d-webview]"
    ) as NodeListOf<HTMLElement>;

    hosts.forEach((el) => {
      // My Apps / xapp overlays manage their own pose — never hide/resize here
      if (el.hasAttribute("data-desktop3d-overlay-webview")) return;
      const id = el.getAttribute("data-desktop3d-webview");
      if (!id) return;
      const projected = lastPoses.current.get(id) || null;

      if (anim && anim.id === id) {
        if (projected) {
          if (anim.reversing) {
            anim.to = projected;
          } else {
            anim.to = getFocusFramePose(originLeft, originTop);
          }
        } else if (!anim.reversing) {
          anim.to = getFocusFramePose(originLeft, originTop);
        }
        const raw = Math.min(1, (now - anim.startedAt) / anim.duration);
        const t = easeOutCubic(raw);
        const expanding = !anim.reversing;
        applyPose(el, lerpPose(anim.from, anim.to, t), {
          interactive: expanding && raw >= 1,
          elevating: true,
          projected: false,
        });
        if (raw >= 1) {
          animRef.current = null;
        }
        return;
      }

      if (interactiveId != null) {
        if (id === interactiveId) {
          applyPose(el, getFocusFramePose(originLeft, originTop), {
            interactive: true,
            elevating: false,
            projected: false,
          });
        } else {
          hidePose(el);
        }
        return;
      }

      // Scene overview: only the desk-front webview (translucent so the room
      // shows through). Neighbor hosts stay hidden — their projected AABBs
      // overlap the front plate and would ghost through at <1 opacity.
      if (sceneFocusedId != null) {
        if (id === sceneFocusedId && projected) {
          applyPose(el, projected, {
            interactive: false,
            elevating: false,
            projected: true,
            opacity: focusedOpacity,
          });
        } else if (projectNeighbors && projected && planes.has(id)) {
          applyPose(el, projected, {
            interactive: false,
            elevating: false,
            projected: true,
            opacity: unfocusedOpacity,
          });
        } else {
          hidePose(el);
        }
        return;
      }

      hidePose(el);
    });
  });

  return null;
}

export default WebViewProjector;
