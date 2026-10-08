import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";

import { settingsActions } from "../../store/settings-slice";
import type { Launchpad3dLayoutId } from "./types";

interface Desktop3DChromeProps {
  /** Compact strip for tab-switcher overlays */
  compact?: boolean;
  /** When false, only show 2D/3D — used on 2D desktop */
  showLayoutControls?: boolean;
  className?: string;
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
  className,
}: Desktop3DChromeProps) {
  const dispatch = useDispatch();
  const visualMode = useSelector(selectDesktopVisualMode);
  const layout = useSelector(selectDesktop3dLayout);

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
    </div>
  );
}

export default Desktop3DChrome;
/** @deprecated use Desktop3DChrome */
export { Desktop3DChrome as LaunchPad3DChrome };
