import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

import { listExperiences } from "./experiences/registry";
import { persistDesktop3dExperienceForWorkspace } from "../../util/desktop3dExperience";
import type { Desktop3dExperienceId } from "./experiences/types";

import "./Desktop3DExperiencePicker.css";

interface Desktop3DExperiencePickerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Popover to pick this space's 3D vista — opened from 3D desktop chrome.
 */
function Desktop3DExperiencePicker({
  open,
  onClose,
}: Desktop3DExperiencePickerProps) {
  const dispatch = useDispatch();
  const panelRef = useRef<HTMLDivElement>(null);
  const selectedWorkspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const experienceId = useSelector(
    (state: any) => state.settings.desktop3dExperience || "control-room"
  );

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (panelRef.current?.contains(t)) return;
      if (
        (t as Element | null)?.closest?.(
          "[data-desktop3d-experience-trigger]"
        )
      ) {
        return;
      }
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="desktop-3d-experience-picker"
      role="dialog"
      aria-label="3D experience for this space"
    >
      <div className="desktop-3d-experience-picker-title">
        World for this space
      </div>
      <p className="desktop-3d-experience-picker-hint">
        Changes what you see through the window. Desk and apps stay the same.
      </p>
      <ul className="desktop-3d-experience-picker-list">
        {listExperiences().map((exp) => {
          const active = exp.id === experienceId;
          return (
            <li key={exp.id}>
              <button
                type="button"
                className={clsx(
                  "desktop-3d-experience-picker-item",
                  active && "active",
                  !exp.available && "disabled"
                )}
                disabled={!exp.available}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  if (!exp.available) return;
                  void persistDesktop3dExperienceForWorkspace(
                    dispatch,
                    selectedWorkspace,
                    exp.id as Desktop3dExperienceId
                  );
                  onClose();
                }}
              >
                <span className="desktop-3d-experience-picker-item-label">
                  {exp.label}
                  {!exp.available ? " · soon" : ""}
                </span>
                <span className="desktop-3d-experience-picker-item-desc">
                  {exp.description}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Desktop3DExperiencePicker;
