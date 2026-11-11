import { useMemo } from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";

import {
  getAppSwitcherEntries,
  type AppSwitcherEntry,
} from "../../util/appSwitcher";
import defaultIcon from "../../images/default_icon.png";

import "./AppSwitcher.css";

type AppSwitcherBodyProps = {
  onActivate: (entry: AppSwitcherEntry) => void;
};

function AppSwitcherBody({ onActivate }: AppSwitcherBodyProps) {
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const windowHistory = useSelector(
    (state: any) => state.session.windowHistory
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );
  const openModalIds = useSelector(
    (state: any) => state.builtin?.openModalIds || []
  );
  const activeModalId = useSelector(
    (state: any) => state.builtin?.activeModalId
  );
  const platform = useSelector((state: any) => state.app.platform);
  const selectedIndex = useSelector(
    (state: any) => state.modal.appSwitcherSelectedIndex
  );

  const entries = useMemo(
    () =>
      getAppSwitcherEntries({
        openWindows,
        openTabs,
        windowTabs,
        activeTabs,
        activeWindowId,
        windowHistory,
        workspaceId: workspace?.id,
        homeWorkspaceId,
        openModalIds,
        activeModalId,
        platform,
      }),
    [
      openWindows,
      openTabs,
      windowTabs,
      activeTabs,
      activeWindowId,
      windowHistory,
      workspace?.id,
      homeWorkspaceId,
      openModalIds,
      activeModalId,
      platform,
    ]
  );

  const selected = entries[selectedIndex] || entries[0];

  if (entries.length === 0) {
    return <div className="app-switcher-empty">No active apps</div>;
  }

  return (
    <div className="app-switcher">
      <div className="app-switcher-strip" role="listbox" aria-label="Active apps">
        {entries.map((entry, index) => {
          const isSelected = index === selectedIndex;
          const Icon = entry.DockIcon;
          return (
            <button
              key={entry.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={clsx(
                "app-switcher-item",
                isSelected && "app-switcher-item--selected"
              )}
              onClick={() => onActivate(entry)}
              title={entry.title}
            >
              {Icon ? (
                <span className="app-switcher-icon app-switcher-icon--glyph">
                  <Icon size={32} color="white" />
                </span>
              ) : (
                <img
                  className="app-switcher-icon"
                  src={entry.icon || defaultIcon}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src = defaultIcon;
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="app-switcher-label" title={selected.title}>
          {selected.title}
        </div>
      ) : null}
    </div>
  );
}

export default AppSwitcherBody;
