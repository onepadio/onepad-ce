import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";

import { sessionActions } from "../../store/session-slice";
import { modalActions } from "../../store/modal-slice";
import { appActions } from "../../store/app-slice";
import { openInternalWindow } from "../../services/window";
import { openAppWindow } from "../../services/window";

import "./SideBar.css";
import { ListGroup, ListGroupItem } from "reactstrap";

// @ts-expect-error TS(2307): Cannot find module or its corresponding type declarations.
import defaultIcon from "../../images/default_icon.png";

import { ChatDots, MusicNoteBeamed, Plus, Robot, Star, Layers } from "react-bootstrap-icons";
import XAppService from "../../services/xapp";
import { windowServiceActions } from "../../store/window-service-slice";
import { Button } from "reactstrap";
import { utilityAppsActions } from "../../store/utility-slice";
import { chatActions } from "../../store/chat-slice";
import { musicPlayerActions } from "../../store/musicplayer-slice";
import { Instagram, Search } from "react-feather";
import WaffleMenuIcon from "../Icons/WaffleMenuIcon";
import { utilityAppItemsDb, utilityAppOthers } from "../UtilityAppsCanvas/utility_apps";
import { itemsDb } from "../../data/store";
import { ReactSVG } from 'react-svg';
import { v4 as uuidv4 } from 'uuid';
import { aiAppsActions } from "renderer/store/ai-slice";
import WorkspaceMenu from "../WorkspaceMenu/WorkspaceMenu";
import NavBarAppsVertical from "../NavBarApps/NavBarAppsVertical";
import { activateBrowser } from "../../hubs/WindowService";

function SideBar() {
  const dispatch = useDispatch();

  const openWindows = useSelector((state: any) => state.session.openWindows);

  const openTabs = useSelector((state: any) => state.session.openTabs);

  const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

  const windowTabs = useSelector((state: any) => state.session.windowTabs);

  const xapps = useSelector((state: any) => state.app.xapps);

  const xappsStore = useSelector((state: any) => state.app.xappsStore);

  const profileId = useSelector((state: any) => state.app.profileId);

  // Add utility and music player state selectors

  const utilityState = useSelector((state: any) => state.utility);

  const musicPlayerState = useSelector((state: any) => state.musicPlayer);

  const whatsappState = useSelector((state: any) => state.chat);

  const [selectedCategory, setSelectedCategory] = useState("favourites");
  const [onCategory, setOnCategory] = useState("");

  const items = useSelector((state: any) => state.workspace.links);
  const isLocal = useSelector((state: any) => state.workspace.isLocal);
  const browserWindows = useSelector((state: any) => state.session.browserWindows);

  // Add music player apps array
  const musicApps = [
    {"name":"Youtube Music", "icon":"./images/store/icon/YouTubeMusic_Logo.png", "url":"https://music.youtube.com/", "key":"youtube-music"},
    {"name":"Spotify", "icon":"./images/store/icon/spotify.png", "url":"https://open.spotify.com/", "key":"spotify"},
    {"name":"Apple Music", "icon":"./images/store/icon/apple-music_icon.png", "url":"https://music.apple.com/", "key":"apple-music"},
    {"name": "BBC Sounds", "icon":"./images/store/icon/bbc_sounds_icon.png", "url":"https://www.bbc.co.uk/sounds", "key":"bbc-sounds"},
    {"name":"Deezer", "icon":"https://e-cdn-files.dzcdn.net/cache/images/common/favicon/apple-touch-icon.dc494e31ef5f888a087a.png", "url":"https://www.deezer.com/", "key":"deezer"},
    {"name":"Amazon Music", "icon":"./images/store/icon/amazon_music_icon.png", "url":"https://music.amazon.com/", "key":"amazon-music"},
    {"name":"Napster", "icon":"https://www.napster.com/wp-content/themes/napsterpitch/assets/favicon/logo192.png", "url":"https://napster.com/gb", "key":"napster"},
    {"name":"Saavn", "icon":"https://www.jiosaavn.com/favicon.ico", "url":"https://www.jiosaavn.com/", "key":"saavn"},
    {"name":"Gaana", "icon":"https://gaana.com/favicon.ico", "url":"https://gaana.com/", "key":"gaana"},
    {"name":"Wynk Music", "icon":"https://wynk.in/favicon.ico", "url":"https://wynk.in/", "key":"wynk-music"},
    {"name":"Hungama Music", "icon":"https://www.hungama.com/favicon.ico", "url":"https://www.hungama.com/", "key":"hungama-music"},
    {"name":"Genius", "icon":"https://assets.genius.com/images/apple-touch-icon.png", "url":"https://genius.com/", "key":"genius"},
  ];

  function newTab(windowId: any, url: any, icon: any, title: any) {
    const now = new Date().getTime();
    return {
      id: Date.now().toString(),
      url: url,
      location: "main",
      type: "xapp",
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function resumeTab(windowId: any, tabId: any, type: any, url: any, icon: any, title: any) {
    let _tabId = tabId ? tabId : Date.now().toString();
    const now = new Date().getTime();
    return {
      id: _tabId,
      url: url,
      location: "main",
      type: type,
      desktop: desktop.id,
      workspace: workspace.id,
      window: windowId,
      state: {
        url: url,
        title: title,
        icon: icon,
      },
      created: now,
      lastAccessed: now,
      sleeping: true,
    };
  }

  function edit(id: any){
    XAppService.get(id).then((app) => {
      log.debug("app:", app);
      dispatch(modalActions.setLocation("xapps"));
      dispatch(
          modalActions.selectIcon(app)
      );
      setTimeout(() => {
          dispatch(
              // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
              modalActions.toggleEditIconModal()
          );
      }, 100);
    });
  }

  // Add function to render utility app items
  function utilityAppItem(item: any, from: any) {
    let _icon_url = from === "itemDb" ? "./images/store/icon/" + item.icon : item.icon;
    let _icon = _icon_url;

    if (_icon_url.includes("svg")) {
      if (item.id !== utilityState.activePlayer) {
        _icon = (
          <ReactSVG src={_icon} className="launch-icon grayscale" />
        )
      } else {
        _icon = (
          <ReactSVG color="white" src={_icon} className="launch-icon" />
        )
      }
    } else {
      if (item.id !== utilityState.activePlayer) {
        _icon = (
          <img width={36} height={36} className="launch-icon grayscale" src={_icon} alt="" />
        )
      } else {
        _icon = (
          <img width={36} height={36} className="launch-icon" src={_icon} alt="" />
        )
      }
    }

    return (
      <ListGroupItem key={uuidv4()} className="d-flex justify-content-center align-items-center m-1 mt-3">
        <div
          className="appicon d-flex justify-content-center"
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title={item.name}
          data-bs-custom-className="custom-tooltip"
          onClick={() => {
            let _url = item.login;
            if (utilityState.activeCategory === "search" && utilityState.searchQuery !== "" && utilityState.searchQuery !== undefined) {
              _url = item.search + utilityState.searchQuery;
            }
            dispatch(utilityAppsActions.setUrl(_url));
            dispatch(utilityAppsActions.setTitle(item.name));
            dispatch(utilityAppsActions.setIcon(_icon_url));
            dispatch(utilityAppsActions.setActivePlayer(item.id));
            if(!utilityState.isOpen){
              dispatch(utilityAppsActions.open(selectedCategory));
            }
          }}
        >
          {_icon}
        </div>
      </ListGroupItem>
    );
  }

  // Add function to render music player items
  function musicPlayerItem(item: any) {
    const isActive = item.key === musicPlayerState.activePlayer;

    return (
      <ListGroupItem key={uuidv4()} className="d-flex justify-content-center align-items-center m-1 mt-3">
        <div
          className="appicon d-flex justify-content-center"
          data-bs-toggle="tooltip"
          data-bs-placement="right"
          title={item.name}
          data-bs-custom-className="custom-tooltip"
          onClick={() => {
            if (musicPlayerState.isOpen) {
              // If music player window is open, switch to this item
              dispatch(musicPlayerActions.setUrl(item.url));
              dispatch(musicPlayerActions.setTitle(item.name));
              dispatch(musicPlayerActions.setActivePlayer(item.key));
            }
          }}
        >
          <img
            width={36}
            className={isActive ? "launch-icon" : "launch-icon grayscale"}
            src={item.icon}
            alt=""
          />
        </div>
      </ListGroupItem>
    );
  }

  function handleOpenWindow(item: any) {
    if (activeWindowId === item.id) {
      return;
    }
    let _url = item.data.customUrl !== "" ? item.data.customUrl : item.data.startUrl;

    if (item.location === "external") {
      openAppWindow(
        item.id,
        _url,
        item.window_type,
        item.is_stateful,
        item.show_controls
      );
    } else {
      log.debug("openInternalWindow:" + _url);
      if (openWindows[item.id] != null) {
        dispatch(
          sessionActions.setActiveWindow({ data: openWindows[item.id] })
        );
        dispatch(sessionActions.setLastGlobalWindowId(item.id));
        return;
      }
      let window = {
        workspace: "all",
        id: item.id,
        url: _url,
        location: "main",
      };

      let _openWindows = Object.assign({}, openWindows);
      let _openTabs = Object.assign({}, openTabs);
      let _windowTabs = Object.assign({}, windowTabs);
      openInternalWindow(window, xapps, openWindows, true, (result: any) => {
        if (result === undefined || result === null) {
          return;
        }
        XAppService.get(item.id)
          .then((app: any) => {
            log.debug("app:", app);
            if (app == null) {
              return;
            }

            let _result = Object.assign({}, app);
            _result.type = "xapp";
            _result.url = _url;
            _result.location = "main";
            _result.desktop = "all";

            log.debug("Result:", _result);

            // Openwindows
            _openWindows[item.id] = _result;
            dispatch(
              sessionActions.setOpenWindows({
                data: _openWindows,
              })
            );
            let _tabIds = [];
            // OpenTabs
            let _tab = newTab(item.id, _url, _result.data.icon, "");
            _openTabs[_tab.id] = _tab;
            _tabIds.push(_tab.id);

            dispatch(
              sessionActions.setOpenTabs({
                data: _openTabs,
              })
            );
            // WindowTabs

            _windowTabs[_result.id] = _tabIds;
            dispatch(
              sessionActions.setWindowTabs({
                data: _windowTabs,
              })
            );

            dispatch(sessionActions.setActiveWindow({ data: _result }));
            dispatch(sessionActions.setLastGlobalWindowId(item.id));
          })
          .catch((error) => {
            log.error("Error:", error);
          });
      });
    }
  }

  function navBarItem(item: any) {
    let _icon = "";
    let _title = item.data.name;
    let _icon_size = 36;

    let _is_sleeping = false;
    if (
      openWindows[item.id] === undefined ||
      openWindows[item.id] === null ||
      openWindows[item.id].sleeping
    ) {
      _is_sleeping = true;
    }

    // Check if this app is in favourites (xapps list)
    const favouriteIds = JSON.parse(localStorage.getItem(`xappIds-${profileId}`) || "[]");
    const isFavourite = favouriteIds.includes(item.id);

    try {
      if (item.data.startUrl.startsWith("https://google.com")) {
        _icon = item.data.icon;
      } else {
        _icon = item.data.icon.length === 0 ? defaultIcon : item.data.icon;
        if (!(_icon.startsWith("http") || _icon.startsWith("data:"))) {
          _icon = "./images/store/icon/" + item.data.icon;
        }
      }

      return (
        <ListGroupItem key={item.id} className="m-1 mt-3 menu-icon"
          onContextMenu={(e) => {
            e.preventDefault();
            let _menu = document.createElement("div");
            _menu.className = "context-menu";
            _menu.innerHTML = `
              <div className="context-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                </svg>
                <span>Edit</span>
              </div>
              <div className="context-menu-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
                <span>Remove</span>
              </div>
            `;
            _menu.style.position = "fixed";
            _menu.style.bottom = "50px";
            _menu.style.left = e.clientX + "px";
            document.body.appendChild(_menu);

            // Add event listeners for menu items
            _menu.querySelector(".context-menu-item:first-child").addEventListener("click", () => {
              edit(item.id);
              document.body.removeChild(_menu);
            });

            _menu.querySelector(".context-menu-item:last-child").addEventListener("click", () => {
              document.body.removeChild(_menu);
              if (window.confirm(`Are you sure you want to delete ${item.data.name}?`)) {
                // check if the app is open
                if (openWindows[item.id] !== undefined && openWindows[item.id] !== null) {
                  dispatch(windowServiceActions.closeWindow(item.id));
                }
                XAppService.delete(item.id).then(() => {
                  let _xappIds =
                    JSON.parse(localStorage.getItem("xappIds-" + profileId)) || [];
                  _xappIds = _xappIds.filter((id: any) => id !== item.id);
                  localStorage.setItem(
                    "xappIds-" + profileId,
                    JSON.stringify(_xappIds)
                  );
                  XAppService.getAll()
                    .then((xapps: any) => {

                      dispatch(appActions.setXApps(xapps.reverse() || []));
                      let _xappsStore = {};

                      xapps.forEach((xapp: any) => {
                        _xappsStore[xapp.id] = xapp;
                      });
                      dispatch(appActions.setXAppsStore(_xappsStore));
                    })
                    .catch((error) => {
                      log.debug("Error getting xapps", error);
                    });
                }).catch((error) => {
                  log.error("Error deleting app:", error);
                  alert("Error deleting app:" + error);
                });
              }
            });

            // Close menu when clicking outside
            const closeMenu = (e: any) => {
              if (document.body.contains(_menu) && !_menu.contains(e.target)) {
                document.body.removeChild(_menu);
                document.removeEventListener("click", closeMenu);
              }
            };

            // Delay adding the click listener to prevent immediate closure
            setTimeout(() => {
              document.addEventListener("click", closeMenu);
            }, 0);
          }}
        >
          <div
            className="appicon d-flex justify-content-center"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            title={_title}
            data-bs-custom-className="custom-tooltip"
            onContextMenu={(e) => {
              e.preventDefault();
            }}
          >
            {_is_sleeping ? (
              <img
                width={_icon_size}
                className="launch-icon grayscale"
                src={_icon}
                alt=""
                onClick={() => handleOpenWindow(item)}
              />
            ) : (
              <img
                width={_icon_size}
                className="launch-icon"
                src={_icon}
                alt=""
                onClick={() => handleOpenWindow(item)}
              />
            )}
          </div>
          {
            windowTabs[item.id] && windowTabs[item.id].length > 0 && (
              <span className="position-absolute bottom-0 right-0 translate-bottom badge rounded-pill bg-primary">{windowTabs[item.id].length}</span>
            )
          }
          {
            isFavourite && (
              <span className="favourite-star">
                <Star size={12} color="white" />
              </span>
            )
          }
        </ListGroupItem>
      );
    } catch (error) {
      console.error(error);
      return <></>;
    }
  }


  function openAppStore() {
    dispatch(modalActions.setLocation("xapps"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  // Drag and drop handlers


  useEffect(() => {
    log.debug("Profile ID: ", profileId);
    if (profileId === "" || profileId === undefined) return;

    XAppService.getAllByProfileId(profileId)
      .then((xapps: any) => {

        dispatch(appActions.setXApps(xapps.reverse() || []));
        let _xappsStore = {};
        let _xappIds: any = [];

        xapps.forEach((xapp: any) => {
          _xappsStore[xapp.id] = xapp;
          _xappIds.push(xapp.id);
        });
        if (localStorage.getItem("xappIds-" + profileId) === null) {
          localStorage.setItem(
            "xappIds-" + profileId,
            JSON.stringify(_xappIds)
          );
        }
        dispatch(appActions.setXAppsStore(_xappsStore));
      })
      .catch((error) => {
        log.debug("Error getting xapps", error);
      });
  }, [profileId]);

  function toggleDesktop() {
    dispatch(sessionActions.getBackToLaunchPad({data: {
      desktopId: desktop.id,
    }}));
  }

  function handleBrowserClick() {
    const homePage = "https://www.google.com/";
    activateBrowser(
      homePage,
      workspace,
      desktop,
      openWindows,
      items,
      isLocal,
      dispatch
    );
  }

  const browserTabsCount = Object.values(openTabs).filter(
    (tab: any) => tab.type === "browser" && tab.workspace === workspace.id
  ).length;

  return (
    <div
      id="globalAppsMenu"
      className="d-flex flex-column justify-content-start global-apps-menu"
    >
      <div className="global-apps-menu-content d-flex flex-column justify-content-center">
        {/* Space Tabs button moved to AppsOverlayMenu */}

        {(() => {
          const filteredApps = Object.values(openWindows).filter((window: any) =>
            (window.type === "app" || window.type === "link") && window.workspace === workspace.id
          );

          const apps = [...filteredApps];
          // Check if appsMenu has any active apps from xappsStore
          const activeAppIds = Object.keys(openWindows);
          const hasActiveXApps = activeAppIds.some((id: any) => xappsStore.hasOwnProperty(id));

          return (
            <>
              {/* NavBar Apps - Vertical Layout - Always visible */}
              <div className="navbar-apps-container">
                <NavBarAppsVertical apps={apps} />
              </div>
            </>
          );
        })()}
      </div>
      <div className="star-icon-container">
        <ListGroup className="d-flex d-none">
          <ListGroupItem className="d-flex justify-content-center flex-column m-0 p-0">
              <Button
                color="dark"
                className={selectedCategory === "search" ? "active" : ""}
                onClick={() => {
                  //setSelectedCategory("search");
                  dispatch(utilityAppsActions.setActiveCategory("search"));
                  dispatch(utilityAppsActions.close());
                  dispatch(musicPlayerActions.close());
                  dispatch(chatActions.close());
                  if(!utilityState.isOpen){
                    dispatch(utilityAppsActions.open("search"));
                  }
                }}
                title="Search"
                onMouseEnter={() => setOnCategory("search")}
                onMouseLeave={() => setOnCategory("")}
              >
                <Search color="white" size={18} />
              </Button>
              <span className="text-white text-xs">Search</span>
          </ListGroupItem>
          <ListGroupItem className="d-flex  justify-content-center flex-column mt-2">
              <Button
                title="OneChat"
                color="dark"
                className={selectedCategory === "chat" ? "active" : ""}
                onClick={() => {
                  dispatch(utilityAppsActions.close());
                  dispatch(musicPlayerActions.close());
                  dispatch(chatActions.open());
                  setSelectedCategory("chat");
                }}
                onMouseEnter={() => setOnCategory("chat")}
                onMouseLeave={() => setOnCategory("")}
              >
                <ChatDots color="white" size={20} />
              </Button>
              {
                <span className="text-white text-xs">Chats</span>
              }
          </ListGroupItem>
          <ListGroupItem className="d-flex  justify-content-center flex-column mt-2">
            <Button
              color="dark"
              title="Social"
              className={selectedCategory === "social" ? "active" : ""}
              onClick={() => {
                dispatch(utilityAppsActions.setActiveCategory("social"));
                dispatch(utilityAppsActions.close());
                dispatch(musicPlayerActions.close());
                dispatch(chatActions.close());
                if(!utilityState.isOpen){
                  dispatch(utilityAppsActions.open("social"));
                }
              }}
              onMouseEnter={() => setOnCategory("social")}
              onMouseLeave={() => setOnCategory("")}
            >
              <Instagram color="white" size={20} />
          </Button>
          {
            <span className="text-white text-xs">Social</span>
          }
          </ListGroupItem>
          <ListGroupItem className="d-flex justify-content-center flex-column mt-2 d-none">
            <Button
              color="dark"
              className={selectedCategory === "favourites" ? "active" : ""}
              onClick={() => {
                setSelectedCategory("favourites");
                dispatch(utilityAppsActions.close());
                dispatch(musicPlayerActions.close());
                dispatch(chatActions.close());
              }}
              title="Favourites"
              onMouseEnter={() => setOnCategory("favourites")}
              onMouseLeave={() => setOnCategory("")}
            >
              <Star
                color="white"
                size={20}
              />
            </Button>
            <span className="text-white text-xs">Favourites</span>
          </ListGroupItem>
        </ListGroup>

      </div>
    </div>
  );
}

export default SideBar;
