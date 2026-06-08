import React from "react";
import { ListGroupItem } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { openAppWindow } from "../../services/window";
import { windowServiceActions } from "../../store/window-service-slice";
import BrowserButton from "../SPNavBar/BrowserButton";

// @ts-expect-error
import defaultIcon from "../../images/default_icon.png";

interface NavBarAppsProps {
  apps: any[];
}

function NavBarApps({ apps }: NavBarAppsProps) {
  const dispatch = useDispatch();
  
  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const activeWindow = useSelector((state: any) => state.session.activeWindow);
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  function handleSwitchWindow(item: any) {
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(appActions.hideTabsScreen());
    if (activeWindowId === item.id) {
      dispatch(
        sessionActions.goBackToPreviousWindow({
          data: {
            desktopId: desktop.id,
          },
        })
      );
      return;
    }
    if (item.location === "external") {
      openAppWindow(
        item.id,
        item.start_url,
        item.window_type,
        item.is_stateful,
        item.show_controls
      );
    } else {
      dispatch(sessionActions.setActiveWindow({ data: item }));
      if (openWindows[item.id].sleeping === true) {
        dispatch(appActions.showSplashScreen({}));
        setTimeout(() => {
          dispatch(appActions.hideSplashScreen({}));
        }, 1000);
      }
    }
  }

  function navBarItem(item: any) {
    if (item.type === "browser") return <></>;
    let _icon = "";
    let _title = item.type === "app" ? item.data.name : item.data.title;

    try {
      if (item.data.startUrl.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon =
          localStorage.getItem(item.data.icon) == null
            ? item.data.icon.length === 0
              ? defaultIcon
              : item.data.icon
            : localStorage.getItem(item.data.icon);
        if (!(_icon.startsWith("http") || _icon.startsWith("data:"))) {
          _icon = "./images/store/icon/" + item.data.icon;
        }
      }
      return (
        <ListGroupItem
          key={uuidv4()}
          id={item.id}
          className={
            item.id === activeWindowId
              ? "d-flex justify-content-center align-items-center nav-item mr-3 active"
              : "d-flex justify-content-center align-items-center nav-item mr-3"
          }
          onClick={() => handleSwitchWindow(item)}
        >
          <div
            className="appicon w-100 d-flex justify-content-center align-items-center"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={_title}
            data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault(); // prevent the default behaviour when right clicked
              // remove all other context menus
              document.querySelectorAll(".context-menu").forEach((menu) => {
                document.body.removeChild(menu);
              });
              let _menu = document.createElement("div");
              _menu.id = "context-menu-" + item.id;
              _menu.className = "context-menu";
              _menu.innerHTML = `
                <div className="context-menu-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
                  </svg>
                  <span>Close</span>
                </div>
              `;
              _menu.style.position = "fixed";
              _menu.style.top = "40px";
              _menu.style.left = e.clientX - 20 + "px";
              document.body.appendChild(_menu);

              _menu?.querySelector(".context-menu-item")
                ?.addEventListener("click", () => {
                  dispatch(windowServiceActions.closeWindow(item.id));
                  document.body.removeChild(_menu);
                });

              _menu?.addEventListener("mouseleave", () => {
                document.body.removeChild(_menu);
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

              // Delay adding the click listener to prevent immediate closure
              setTimeout(() => {
                document?.addEventListener("click", closeMenu);
              }, 0);
            }}
          >
            <img
              className="align-self-center launch-icon"
              width={24}
              src={_icon}
              alt=""
            />
          </div>
          {
            windowTabs[item.id] && windowTabs[item.id].length > 0 && (
              <span className="position-absolute bottom-0 right-0 translate-bottom badge rounded-pill bg-primary">{windowTabs[item.id].length}</span>
            )
          }
        </ListGroupItem>
      );
    } catch (error) {
      console.error(error);
      return <></>;
    }
  }

  return (
    <>
      {activeWindow?.id !== "launchpad" ? (
        <>
          <BrowserButton />
          {apps.map((item) => {
            return navBarItem(item);
          })}
        </>
      ) : (
        <></>
      )}
    </>
  );
}

export default NavBarApps;
