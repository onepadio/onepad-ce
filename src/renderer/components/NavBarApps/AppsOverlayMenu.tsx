import { Plus, Layers } from "react-bootstrap-icons";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import log from "loglevel";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import "./AppsOverlayMenu.css";

import { windowServiceActions } from "../../store/window-service-slice";
import { workspaceActions } from "../../store/workspace-slice";
import DesktopService from "../../services/desktop";

// @ts-expect-error TS(2307): Cannot find module or its corresponding type declarations.
import defaultIcon from "../../images/default_icon.png";

interface AppsOverlayMenuProps {
  apps: any[];
  activeWindowId: string | null;
  onSelectApp: (appId: string) => void;
  onLaunchpadClick: () => void;
  onBrowserClick: () => void;
  isLaunchpadActive: boolean;
  browserTabsCount: number;
}

function AppsOverlayMenu({ 
  apps, 
  activeWindowId, 
  onSelectApp, 
  onLaunchpadClick,
  onBrowserClick,
  isLaunchpadActive,
  browserTabsCount
}: AppsOverlayMenuProps) {
  const dispatch = useDispatch();
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const pinnedApps = desktop?.state?.pinnedApps || [];
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  
  async function handleTogglePin(appId: string) {
    if (!desktop?.id) return;

    try {
      await DesktopService.togglePinnedApp(desktop.id, appId);
      log.debug("Toggled pin for app:", appId);

      // Update the desktop in Redux store
      const updatedDesktop = await DesktopService.get(desktop.id);
      dispatch(workspaceActions.selectDesktop({ desktop: updatedDesktop }));
    } catch (error) {
      log.error("Error toggling pin:", error);
    }
  }
  
  const getAppIcon = (app: any) => {
    let _icon = "";
    try {
      if (app.data.startUrl && app.data.startUrl.startsWith("https://google.com")) {
        _icon = app.data.icon;
      } else {
        _icon =
          localStorage.getItem(app.data.icon) == null
            ? app.data.icon.length === 0
              ? defaultIcon
              : app.data.icon
            : localStorage.getItem(app.data.icon);
        if (!(_icon.startsWith("http") || _icon.startsWith("data:"))) {
          _icon = "./images/store/icon/" + app.data.icon;
        }
      }
    } catch (error) {
      console.error("Error getting app icon:", error);
      _icon = defaultIcon;
    }
    return _icon;
  };

  const getAppTitle = (app: any) => {
    return app.type === "app" ? app.data.name : app.data.title;
  };

  // Filter out browser type apps
  const filteredApps = apps.filter(app => app.type !== "browser");

  return (
    <div className="apps-overlay-menu">
      <div className="apps-overlay-menu-content">
        <div className="apps-overlay-menu-items">
          <button
            className={`app-menu-item ${isLaunchpadActive ? "active" : ""}`}
            onClick={onLaunchpadClick}
            onMouseEnter={() => setHoveredApp("launchpad")}
            onMouseLeave={() => setHoveredApp(null)}
          >
            <WaffleMenuIcon size={20} />
            {hoveredApp === "launchpad" && (
              <div className="app-tooltip">Launchpad</div>
            )}
          </button>
          
          <button
            className="app-menu-item position-relative"
            onClick={onBrowserClick}
            onMouseEnter={() => setHoveredApp("browser")}
            onMouseLeave={() => setHoveredApp(null)}
          >
            <Layers color="white" size={20} />
            {browserTabsCount > 0 && (
              <span className="position-absolute bottom-0 right-0 translate-middle badge rounded-pill bg-primary badge-count">
                {browserTabsCount}
              </span>
            )}
            {hoveredApp === "browser" && (
              <div className="app-tooltip">Space Tabs</div>
            )}
          </button>
          
          {filteredApps.map((app) => (
            <button
              key={app.id}
              className={`app-menu-item ${activeWindowId === app.id ? "active" : ""}`}
              onClick={() => onSelectApp(app.id)}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                const isPinned = pinnedApps.includes(app.id);
                const isWindowOpen = openWindows[app.id] != null;

                // remove all other context menus
                document.querySelectorAll(".context-menu").forEach((menu) => {
                  document.body.removeChild(menu);
                });
                let _menu = document.createElement("div");
                _menu.id = "context-menu-" + app.id;
                _menu.className = "context-menu";
                _menu.innerHTML = `
                  <div class="context-menu-item pin-item">
                    ${isPinned ? `
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-fill" viewBox="0 0 16 16">
                        <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354"/>
                      </svg>
                    ` : `
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin" viewBox="0 0 16 16">
                        <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282"/>
                      </svg>
                    `}
                    <span>${isPinned ? 'Unpin' : 'Pin'}</span>
                  </div>
                  <div class="context-menu-item${!isWindowOpen ? ' disabled' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                    </svg>
                    <span>Close</span>
                  </div>
                `;
                _menu.style.position = "fixed";
                _menu.style.opacity = "0";
                document.body.appendChild(_menu);
                
                // Get menu height and position it upward
                const menuHeight = _menu.offsetHeight;
                _menu.style.top = (e.clientY - menuHeight - 10) + "px";
                _menu.style.left = (e.clientX + 10) + "px";
                _menu.style.opacity = "1";

                _menu?.querySelector(".context-menu-item.pin-item")
                  ?.addEventListener("click", () => {
                    handleTogglePin(app.id);
                    document.body.removeChild(_menu);
                  });

                _menu?.querySelector(".context-menu-item:nth-child(2)")
                  ?.addEventListener("click", () => {
                    if (isWindowOpen) {
                      dispatch(windowServiceActions.closeWindow(app.id));
                      document.body.removeChild(_menu);
                    }
                  });

                _menu?.addEventListener("mouseleave", () => {
                  if (document.body.contains(_menu)) {
                    document.body.removeChild(_menu);
                  }
                });

                // Close menu when clicking outside
                const closeMenu = (e: any) => {
                  if (
                    document.body.contains(_menu) &&
                    !_menu.contains(e.target)
                  ) {
                    document.body.removeChild(_menu);
                    document?.removeEventListener("click", closeMenu);
                  }
                };

                setTimeout(() => {
                  document?.addEventListener("click", closeMenu);
                }, 0);
              }}
            >
              <img
                width={20}
                height={20}
                className="app-menu-icon"
                src={getAppIcon(app)}
                alt={getAppTitle(app)}
                onError={(e) => {
                  e.currentTarget.src = defaultIcon;
                }}
              />
              {hoveredApp === app.id && (
                <div className="app-tooltip">{getAppTitle(app)}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppsOverlayMenu;
