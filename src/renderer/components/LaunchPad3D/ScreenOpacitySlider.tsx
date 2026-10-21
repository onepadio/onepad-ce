import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Gear } from "react-bootstrap-icons";

import { settingsActions } from "../../store/settings-slice";
import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";

import "./ScreenOpacitySlider.css";

interface ScreenOpacitySliderProps {
  deskFrontCardId?: string;
  visible?: boolean;
}

/** Inset from the webview bottom-right corner */
const INSET = 10;

/**
 * Gear on the front webview's bottom-right corner. Opens opacity when clicked.
 */
function ScreenOpacitySlider({
  deskFrontCardId = "",
  visible = true,
}: ScreenOpacitySliderProps) {
  const dispatch = useDispatch();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastPosRef = useRef<{ left: number; top: number } | null>(null);
  const [open, setOpen] = useState(false);
  const opacity = useSelector(
    (state: any) =>
      (state.settings.desktop3dScreenOpacity as number | undefined) ?? 0.7
  );

  const hostCardId =
    deskFrontCardId === OTHERS_BROWSER_CARD_ID
      ? OTHERS_BROWSER_CARD_ID
      : deskFrontCardId;

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      dispatch(settingsActions.setDesktop3dScreenOpacity(n));
    },
    [dispatch]
  );

  const stopScene = useCallback((e: PointerEvent) => {
    e.stopPropagation();
  }, []);

  const toggle = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  useEffect(() => {
    lastPosRef.current = null;
    setOpen(false);
  }, [hostCardId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!visible || !hostCardId) return;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const root = rootRef.current;
      if (!root) return;

      const host = document.querySelector(
        `[data-desktop3d-webview="${hostCardId}"]`
      ) as HTMLElement | null;

      let next: { left: number; top: number } | null = null;
      if (host) {
        const cs = window.getComputedStyle(host);
        const visibleHost =
          cs.visibility !== "hidden" &&
          cs.display !== "none" &&
          parseFloat(cs.opacity || "1") > 0.05 &&
          host.classList.contains("is-projected");
        if (visibleHost) {
          const r = host.getBoundingClientRect();
          if (r.width >= 80 && r.height >= 80) {
            next = {
              left: r.right - INSET,
              top: r.bottom - INSET,
            };
          }
        }
      }

      if (!next) {
        if (!lastPosRef.current) {
          root.style.visibility = "hidden";
          return;
        }
        next = lastPosRef.current;
      }

      const prev = lastPosRef.current;
      if (
        prev &&
        Math.abs(prev.left - next.left) < 0.25 &&
        Math.abs(prev.top - next.top) < 0.25
      ) {
        root.style.visibility = "visible";
        return;
      }
      lastPosRef.current = next;
      root.style.left = `${next.left}px`;
      root.style.top = `${next.top}px`;
      root.style.visibility = "visible";
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, hostCardId]);

  const pct = Math.round(opacity * 100);

  if (!visible || !hostCardId) return null;

  return (
    <div
      ref={rootRef}
      className={`screen-settings${open ? " is-open" : ""}`}
      onPointerDown={stopScene}
      onClick={(e) => e.stopPropagation()}
      style={{ visibility: "hidden" }}
    >
      <button
        type="button"
        className="screen-settings-btn"
        aria-label="Screen settings"
        aria-expanded={open}
        aria-controls="screen-settings-panel"
        title="Screen settings"
        onClick={toggle}
      >
        <Gear size={14} />
      </button>

      {open ? (
        <div
          id="screen-settings-panel"
          className="screen-settings-panel"
          role="dialog"
          aria-label="Screen settings"
        >
          <div className="screen-opacity-slider">
            <label
              className="screen-opacity-slider-label"
              htmlFor="screen-opacity"
            >
              Opacity
            </label>
            <input
              id="screen-opacity"
              className="screen-opacity-slider-input"
              type="range"
              min={0.15}
              max={1}
              step={0.01}
              value={opacity}
              onChange={onChange}
              aria-valuemin={15}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Screen opacity"
            />
            <span className="screen-opacity-slider-value">{pct}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ScreenOpacitySlider;
