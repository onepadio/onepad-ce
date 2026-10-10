import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

import { settingsActions } from "../../store/settings-slice";
import type { Launchpad3dLayoutId } from "./types";
import Desktop3DExperiencePicker from "./Desktop3DExperiencePicker";
import { getExperience } from "./experiences/registry";

interface Desktop3DChromeProps {
  /** Compact strip for tab-switcher overlays */
  compact?: boolean;
  /** When false, only show 2D/3D — used on 2D desktop */
  showLayoutControls?: boolean;
  /** Show space world / experience picker (3D Desktop) */
  showExperienceSetup?: boolean;
  className?: string;
  exploreMode?: boolean;
  onExploreModeChange?: (explore: boolean) => void;
}

function selectDesktopVisualMode(state: any): "2d" | "3d" {
  return (
    state.settings.desktopVisualMode ||
    state.settings.launchpadVisualMode ||
    "2d"
  );
}

function selectDesktop3dLayout(state: any): Launchpad3dLayoutId {
  return (
    state.settings.desktop3dLayout ||
    state.settings.launchpad3dLayout ||
    "coverflow"
  );
}

/** 2D/3D Desktop mode + Cover/Mission/Ring/Scene (Scene = room env) */
function Desktop3DChrome({
  compact = false,
  showLayoutControls = true,
  showExperienceSetup = false,
  className,
  exploreMode = false,
  onExploreModeChange,
}: Desktop3DChromeProps) {
  const dispatch = useDispatch();
  const visualMode = useSelector(selectDesktopVisualMode);
  const layout = useSelector(selectDesktop3dLayout);
  const experienceId = useSelector(
    (state: any) => state.settings.desktop3dExperience || "control-room"
  );
  const experience = getExperience(experienceId);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const canExplore = experience.usesDeskRoom !== false;

  const layouts: { id: Launchpad3dLayoutId; label: string; title: string }[] = [
    { id: "coverflow", label: "Cover", title: "Cover Flow over wallpaper" },
    { id: "mission", label: "Mission", title: "Mission grid over wallpaper" },
    { id: "ring", label: "Ring", title: "Circular ring over wallpaper" },
    { id: "scene", label: "Scene", title: "Control room 3D scene" },
  ];

  return (
    <div
      className={clsx(
        "desktop-3d-chrome",
        compact && "desktop-3d-chrome-compact",
        className
      )}
    >
      <div
        className="desktop-3d-chrome-group"
        role="group"
        aria-label="Desktop view mode"
      >
        <button
          type="button"
          className={clsx(
            "desktop-3d-chrome-btn",
            visualMode === "2d" && "active"
          )}
          onClick={() => dispatch(settingsActions.setDesktopVisualMode("2d"))}
          title="2D Desktop"
        >
          2D
        </button>
        <button
          type="button"
          className={clsx(
            "desktop-3d-chrome-btn",
            visualMode === "3d" && "active"
          )}
          onClick={() => {
            dispatch(settingsActions.setDesktopVisualMode("3d"));
            dispatch(settingsActions.setDesktop3dLayout("scene"));
          }}
          title="3D Desktop"
        >
          3D
        </button>
      </div>

      {showLayoutControls && visualMode === "3d" && (
        <div
          className="desktop-3d-chrome-group"
          role="group"
          aria-label="3D layout or scene"
        >
          {layouts.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx(
                "desktop-3d-chrome-btn",
                layout === item.id && "active"
              )}
              title={item.title}
              onClick={() =>
                dispatch(settingsActions.setDesktop3dLayout(item.id))
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showExperienceSetup && visualMode === "3d" && (
        <div className="desktop-3d-chrome-experience-wrap">
          <div
            className="desktop-3d-chrome-group"
            role="group"
            aria-label="Space world"
          >
            <button
              type="button"
              data-desktop3d-experience-trigger
              className={clsx(
                "desktop-3d-chrome-btn",
                experienceOpen && "active"
              )}
              title={`World for this space: ${experience.label}`}
              aria-expanded={experienceOpen}
              aria-haspopup="dialog"
              onClick={() => setExperienceOpen((o) => !o)}
            >
              World
            </button>
          </div>
          <Desktop3DExperiencePicker
            open={experienceOpen}
            onClose={() => setExperienceOpen(false)}
          />
        </div>
      )}

      {visualMode === "3d" && onExploreModeChange && canExplore && (
        <div
          className="desktop-3d-chrome-group"
          role="group"
          aria-label="Explore vista"
        >
          <button
            type="button"
            className={clsx(
              "desktop-3d-chrome-btn",
              exploreMode && "active"
            )}
            title={
              exploreMode
                ? "Back to desk"
                : "Look out the window (explore)"
            }
            onClick={() => onExploreModeChange(!exploreMode)}
          >
            {exploreMode ? "Desk" : "Explore"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Desktop3DChrome;
/** @deprecated use Desktop3DChrome */
export { Desktop3DChrome as LaunchPad3DChrome };
