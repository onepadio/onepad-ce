import React, { useState, useEffect } from "react";
import { ListGroupItem } from "reactstrap";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { Plus } from "react-bootstrap-icons";
import log from "loglevel";

import { appActions } from "../../store/app-slice";
import { sessionActions } from "../../store/session-slice";
import { modalActions } from "../../store/modal-slice";
import { sidebarActions } from "../../store/sidebar-slice";
import XAppService from "../../services/xapp";

// @ts-expect-error TS(2307): Cannot find module or its corresponding type declarations.
import defaultIcon from "../../images/default_icon.png";

import "./NavBarAppsVertical.css";

interface NavBarAppsVerticalProps {
  apps: any[];
}

function NavBarAppsVertical({ apps }: NavBarAppsVerticalProps) {
  const dispatch = useDispatch();

  const profileId = useSelector((state: any) => state.app.profileId);
  const xappsStore = useSelector((state: any) => state.app.xappsStore);
  const sidebarAppId = useSelector((state: any) => state.sidebar.appId);
  const sidebarIsOpen = useSelector((state: any) => state.sidebar.isOpen);
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);
  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const [xapps, setXapps] = useState<any[]>([]);

  // Load xapps from localStorage
  useEffect(() => {
    const xappIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
    const userApps = xappIds
      .map((id: string) => xappsStore[id])
      .filter((app: any) => app);
    setXapps(userApps);
  }, [profileId, xappsStore]);

  function handleAddXApp() {
    dispatch(modalActions.setLocation("xapps"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  function handleSwitchWindow(item: any) {
    // Check if this app is already open in sidebar
    if (sidebarIsOpen && sidebarAppId === item.id) {
      // Close sidebar if same app is clicked
      dispatch(sidebarActions.close());
      return;
    }

    // Open app in sidebar window
    handleOpenWindow(item);
  }

  function handleOpenWindow(item: any) {
    let _url = item.data.customUrl !== "" && item.data.customUrl ? item.data.customUrl : item.data.startUrl;
    
    // Open app in sidebar window
    dispatch(sidebarActions.open({
      url: _url,
      title: item.data?.name || "App",
      appId: item.id,
      icon: item.data?.icon || "",
      userAgent: item.data?.useragent || ""
    }));
  }

  function handleRemoveApp(item: any) {
    // Close sidebar if this app is currently open
    if (sidebarIsOpen && sidebarAppId === item.id) {
      dispatch(sidebarActions.close());
    }

    // Remove from localStorage
    const xappIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
    const updatedIds = xappIds.filter((id: string) => id !== item.id);
    localStorage.setItem(`xappIds-${profileId}`, JSON.stringify(updatedIds));

    // Update local state
    setXapps(xapps.filter((app) => app.id !== item.id));

    log.info(`Removed xapp ${item.id} from navigation bar`);
  }

  function handleContextMenu(e: React.MouseEvent, item: any) {
    e.preventDefault();
    e.stopPropagation();

    // Remove any existing context menus
    document.querySelectorAll(".context-menu").forEach((menu) => {
      document.body.removeChild(menu);
    });

    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.innerHTML = `
      <div class="context-menu-item remove-item">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
        </svg>
        <span>Remove</span>
      </div>
    `;

    menu.style.position = "fixed";
    menu.style.opacity = "0";
    document.body.appendChild(menu);

    // Get menu dimensions and position it next to the icon
    const menuHeight = menu.offsetHeight;
    const menuWidth = menu.offsetWidth;

    // Position the menu upward from cursor, and to the right
    let yPosition = e.clientY - menuHeight - 10;
    let xPosition = e.clientX + 10;

    // Adjust if menu would go off screen
    if (yPosition < 10) {
      yPosition = e.clientY + 10; // Show below if not enough space above
    }
    if (xPosition + menuWidth > window.innerWidth) {
      xPosition = e.clientX - menuWidth - 10; // Show to the left instead
    }

    menu.style.top = `${yPosition}px`;
    menu.style.left = `${xPosition}px`;
    menu.style.opacity = "1";

    // Handle remove click
    menu.querySelector(".remove-item")?.addEventListener("click", () => {
      handleRemoveApp(item);
      document.body.removeChild(menu);
    });

    // Close menu on mouse leave
    menu.addEventListener("mouseleave", () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu);
      }
    });

    // Close menu when clicking outside
    const closeMenu = (e: any) => {
      if (document.body.contains(menu) && !menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.removeEventListener("click", closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 0);
  }

  function navBarItem(item: any) {
    let _icon = "";
    let _title = item.data?.name || "App";
    const isActive = sidebarIsOpen && sidebarAppId === item.id;

    try {
      if (!item.data?.icon || item.data.icon.length === 0) {
        _icon = defaultIcon;
      } else if (item.data.icon.startsWith("http") ||
                 item.data.icon.startsWith("data:") ||
                 item.data.icon.startsWith("blob:")) {
        _icon = item.data.icon;
      } else if (item.data.startUrl?.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon = "./images/store/icon/" + item.data.icon;
      }

      let itemClassName = "d-flex justify-content-center align-items-center m-1 mt-3 menu-icon";
      if (isActive) {
        itemClassName += " active";
      }

      return (
        <ListGroupItem
          key={item.id}
          id={item.id}
          className={itemClassName}
          onClick={() => handleSwitchWindow(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <div
            className="appicon d-flex justify-content-center"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={_title}
            data-bs-custom-className="custom-tooltip"
          >
            <img
              width={36}
              className="launch-icon"
              src={_icon}
              alt={_title}
              onError={(e: any) => {
                e.target.src = defaultIcon;
              }}
            />
          </div>
        </ListGroupItem>
      );
    } catch (error) {
      console.error(error);
      return <></>;
    }
  }

  return (
      <div className="navbar-apps-vertical-wrapper d-flex flex-column justify-content-start">
        <div className="navbar-apps-vertical d-flex flex-column justify-content-center">
          {xapps.map((item) => {
            return navBarItem(item);
          })}
          
          {/* Add button */}
          
        </div>
        <div
            key="add-xapp"
            className="d-flex justify-content-center align-items-center m-1 mt-3 menu-icon add-xapp-button"
            onClick={handleAddXApp}
            title="Add new app"
          >
            <div className="appicon d-flex justify-content-center">
              <Plus color="white" size={24} />
            </div>
          </div>
      </div>
  );
}

export default NavBarAppsVertical;
