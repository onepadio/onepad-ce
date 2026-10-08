import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { getRegisteredPlanes } from "./planeRegistry";

/** Local plane size used by CardMesh (before group scale) */
const PLANE_W = 2.4;
const PLANE_H = 1.5;

/** Room above webview for floating address bar + gap */
const FOCUS_TOP_INSET = 100;
/** Leave room for AppsOverlayMenu dock */
const FOCUS_BOTTOM_INSET = 78;
const FOCUS_SIDE_INSET = 56;
/** Slightly smaller than full band so window feels inset in the scene */
const FOCUS_HEIGHT_FILL = 0.96;
const FOCUS_ASPECT = 16 / 10;

/**
 * Native resolution at which every webview always renders.
 * The outer host div is scaled DOWN via CSS scale() to fit the wall card.
 * This keeps webview render quality identical whether on the wall or in HUD.
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
function getFocusFramePose(originLeft = 0, originTop = 0): RectPose {
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
  height = Math.min(height, bandH * FOCUS_HEIGHT_FILL);
  width = Math.min(width, height * FOCUS_ASPECT, bandW);

  return {
    left: (vw - width) / 2 - originLeft,
    top: bandTop + (bandH - height) / 2 - originTop,
    width,
    height,
  };
}

function getDesktopOrigin(): { left: number; top: number } {
  const root = document.querySelector(
    ".desktop-3d-fullscreen"
  ) as HTMLElement | null;
  const r = root?.getBoundingClientRect();
  return { left: r?.left ?? 0, top: r?.top ?? 0 };
}

/**
 * Axis-aligned screen rect covering the projected plane.
 * No rotate / matrix3d — Electron <webview> goes blank under those transforms.
 */
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
  // Allow the projected rect to be larger than the canvas (card fills/overflows screen)
  if (width < 8 || height < 8) return null;

  return { left, top, width, height };
}

/**
 * Apply position + size to the host div.
 *
 * For wall cards (projected = true):
 *   - Outer div is positioned at card screen location, sized to native resolution
 *   - CSS scale() shrinks it to match projected card size  ← render quality preserved
 * For HUD overlay (projected = false):
 *   - Outer div is sized directly to pose (no scale needed)
 */
function applyPose(
  el: HTMLElement,
  pose: RectPose,
  opts: { interactive: boolean; elevating: boolean; projected?: boolean }
) {
  el.style.visibility = "visible";
  el.style.opacity = "1";
  el.style.position = "absolute";
  el.style.margin = "0";
  el.style.padding = "0";
  el.style.border = "none";
  el.style.overflow = "hidden";
  el.style.borderRadius = opts.interactive || opts.elevating ? "10px" : "6px";
  el.style.boxShadow =
    opts.interactive || opts.elevating
      ? "0 16px 48px rgba(0, 0, 0, 0.55)"
      : "0 8px 28px rgba(0, 0, 0, 0.35)";
  el.style.pointerEvents = opts.interactive ? "auto" : "none";
  el.style.zIndex = opts.interactive || opts.elevating ? "20" : "10";

  if (opts.projected) {
    // Scale native resolution down to projected card size.
    // scale() is safe with Electron <webview> — only rotate/matrix3d blank it.
    const scaleX = pose.width / NATIVE_W;
    const scaleY = pose.height / NATIVE_H;
    el.style.left = `${pose.left}px`;
    el.style.top = `${pose.top}px`;
    el.style.width = `${NATIVE_W}px`;
    el.style.height = `${NATIVE_H}px`;
    el.style.transformOrigin = "0 0";
    el.style.transform = `scale(${scaleX}, ${scaleY})`;
  } else {
    // HUD overlay: render at exact pose size (full resolution)
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
  el.style.opacity = "0";
}

function WebViewProjector({
  interactiveId = null,
  sceneFocusedId = null,
}: {
  interactiveId?: string | null;
  /** Show this card's webview at its ring-card position (no HUD zoom). All others hidden. */
  sceneFocusedId?: string | null;
}) {
  const { camera, gl } = useThree();
  const lastPoses = useRef(new Map<string, RectPose>());
  const animRef = useRef<FocusAnim | null>(null);
  const prevInteractive = useRef<string | null>(null);

  useEffect(() => {
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
  }, [interactiveId, sceneFocusedId]);

  useFrame(() => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const canvasW = rect.width;
    const canvasH = rect.height;
    const now = performance.now();
    const anim = animRef.current;
    const { left: originLeft, top: originTop } = getDesktopOrigin();

    getRegisteredPlanes().forEach((object, id) => {
      const el = document.querySelector(
        `[data-desktop3d-webview="${id}"]`
      ) as HTMLElement | null;
      if (!el) return;

      const projectedRaw = getProjectedPose(
        object,
        camera,
        canvasW,
        canvasH,
        rect.left,
        rect.top
      );
      const projected = projectedRaw
        ? {
            left: projectedRaw.left - originLeft,
            top: projectedRaw.top - originTop,
            width: projectedRaw.width,
            height: projectedRaw.height,
          }
        : null;
      if (projected) {
        lastPoses.current.set(id, projected);
      }

      if (anim && anim.id === id) {
        if (anim.reversing && projected) {
          anim.to = projected;
        } else if (!anim.reversing) {
          anim.to = getFocusFramePose(originLeft, originTop);
        }
        const raw = Math.min(1, (now - anim.startedAt) / anim.duration);
        const t = easeOutCubic(raw);
        // During animation: lerp between projected (wall) and HUD sizes.
        // Use projected mode while collapsing, HUD mode while expanding.
        const expanding = !anim.reversing;
        applyPose(el, lerpPose(anim.from, anim.to, t), {
          interactive: expanding && raw >= 1,
          elevating: true,
          projected: false, // animate in screen space at interpolated size
        });
        if (raw >= 1) {
          animRef.current = null;
        }
        return;
      }

      if (interactiveId != null && interactiveId === id) {
        // HUD full-size overlay — render at pose dimensions (full resolution)
        applyPose(el, getFocusFramePose(originLeft, originTop), {
          interactive: true,
          elevating: false,
          projected: false,
        });
        return;
      }

      // Scene overview: only the focused card's webview — never paint neighbors
      // (painting many Electron webviews at once causes blank/corrupt renders).
      if (sceneFocusedId != null) {
        if (id !== sceneFocusedId || !projected) {
          hidePose(el);
          return;
        }
        applyPose(el, projected, {
          interactive: false,
          elevating: false,
          projected: true,
        });
        return;
      }

      // No focused/interactive card — keep every host hidden
      hidePose(el);
    });
  });

  return null;
}

export default WebViewProjector;
