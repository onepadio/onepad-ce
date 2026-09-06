import log from "loglevel";
import { v4 as uuidv4 } from 'uuid';

import { openInternalWindow} from '../services/window'
import { windowServiceActions } from "../store/window-service-slice";
import { createNavHistoryState } from "./navHistory";

// @ts-expect-error
import globe_icon from '../images/globe_icon_96.png';

export function isValidDomain4(url: any) {
    const domainRegex = /^(https?:\/\/)?(www\.)?(([a-zA-Z0-9-]{1,63}\.)+([a-zA-Z]{2,63})|localhost|(\d{1,3}\.){3}\d{1,3})(\.[a-zA-Z]{2,63})?(:(\d{1,5}))?(\/|$)/;
    return domainRegex.test(url);
}

export function handleSearchEngine(
    _url: any, links: any, openWindows: any, dispatch: any, sessionActions: any, appActions: any,
    setSearchQuery: any, searchQuery: any, desktop: any, workspace: any, activeBrowserWindowId: any, activeTabs: any, isLocal: any,
    openTabs: any, windowTabs: any, sessionState: any
    ){
    //search engine
    let _domain = new URL(_url).hostname.replace("www.","");
    log.debug("links", links);
    let _link = links.find((link: any) => link.domain.includes(_domain));
    if(_link !== undefined){
        log.debug("Search engine found", _link);
        if(openWindows[_link.id] != null){
            dispatch(sessionActions.setActiveWindow({data: openWindows[_link.id]}));
            if(openWindows[_link.id].sleeping === true){
                dispatch(appActions.showSplashScreen());
            }
        }else{
            handleOpenLinkWindow(_link, _url, links, openWindows, isLocal, dispatch, sessionActions, appActions, desktop, workspace, openTabs, windowTabs, sessionState);
        }
    }else{
        handleSpaceBrowserSearch(_url, searchQuery, links, openWindows, activeBrowserWindowId, activeTabs, desktop, workspace, dispatch, sessionActions, setSearchQuery, isLocal, openTabs, windowTabs);
    }
}

function handleOpenLinkWindow(
    link: any , url = "", links: any, openWindows: any, isLocal: any, dispatch: any, sessionActions: any, appActions: any, desktop: any, workspace: any, openTabs: any, windowTabs: any, sessionState: any
    ){
    log.debug("handleOpenLinkWindow:"+link.data.startUrl);
    let window = {
        workspace: workspace.id,
        id: link.id,
        url: link.data.startUrl,
        location: "main",
    }

    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);
    openInternalWindow(
        window,
        links,
        openWindows,
        isLocal,
        (result: any) => {
            if(result === undefined || result === null){
                return;
            }

            let _result = Object.assign({}, link);
            _result.type = "link";
            _result.url = link.data.startUrl;
            _result.location = "main";
            _result.desktop = desktop.id;

            log.debug("Result:",_result);

            // Openwindows
            _openWindows[link.id] = _result;
            dispatch(
                sessionActions.setOpenWindows({
                data: _openWindows,
            })
            );
            let _tabIds = [];
            // OpenTabs
            if(!sessionState.isInSession && link.state && link.state.tabs && link.state.tabs.length > 0){
                link.state.tabs.forEach((tabState: any) => {
                    log.debug("tabState:",tabState);
                    let _tab = linkTab(link.id, tabState.url, tabState.icon, tabState.title, desktop, workspace);
                    _openTabs[_tab.id] = _tab;
                    _tabIds.push(_tab.id);
                });
            }else{
                let _url = url !== "" ? url : link.data.startUrl;
                // @ts-expect-error TS(2554): Expected 6 arguments, but got 4.
                let _tab = linkTab(link.id, _url, link.data.icon, "");
                _openTabs[_tab.id] = _tab;
                _tabIds.push(_tab.id);
            }

            dispatch(
                sessionActions.setOpenTabs({
                data: _openTabs,
            }));
            // WindowTabs
            _windowTabs[_result.id] = _tabIds;
            dispatch(
                sessionActions.setWindowTabs({
                data: _windowTabs,
            }));

            dispatch(sessionActions.setActiveWindow({data: _result}));
            dispatch(appActions.showSplashScreen());
        },
    );
}

function linkTab(windowId: any, url: any, icon: any, title: any, desktop: any, workspace: any){
    const now = new Date().getTime();
    return {
        id: uuidv4(),
        url: url,
        location: "main",
        type: "link",
        desktop: desktop.id,
        workspace: workspace.id,
        window: windowId,
        state: createNavHistoryState(url, title, icon),
        created: now,
        lastAccessed: now,
        sleeping: true,
    }
  }

export function handleSpaceBrowserSearch(
    queryOrUrl: any, searchQuery: any, links: any, openWindows: any, activeBrowserWindowId: any, activeTabs: any, desktop: any, workspace: any, dispatch: any, sessionActions: any, setSearchQuery: any, isLocal: any, openTabs: any, windowTabs: any
    ){
    log.debug("searchQuery", searchQuery);
    let _openWindows = Object.assign({}, openWindows);
    let _openTabs = Object.assign({}, openTabs);
    let _windowTabs = Object.assign({}, windowTabs);
    let _id = "browser_".concat(uuidv4());
    if(activeBrowserWindowId !== "" && _openWindows[activeBrowserWindowId] !== undefined){
        let window = _openWindows[activeBrowserWindowId];

        // Use WindowService to create tab
        dispatch(windowServiceActions.openNewTab({
            windowId: window.id,
            url: queryOrUrl
        }));

        // ActiveWindow
        dispatch(sessionActions.setActiveWindow({data: window}));
        setSearchQuery("");
    }else{
        let window = {
            workspace: workspace.id,
            id: _id,
            url: ":browser",
            location: "main",
        }

        openInternalWindow(
            window,
            links,
            openWindows,
            isLocal,
            (result: any) => {
                if(result === undefined || result === null){
                    return;
                }
                let _result = Object.assign({}, result);
                _result.type = "browser";
                _result.url = queryOrUrl;
                _result.location = "main";
                _result.desktop = desktop.id;
                _result.workspace = workspace.id;

                log.debug("Result:"+_result);
                // OpenWindows
                _openWindows[result.id] = _result;
                dispatch(
                  sessionActions.setOpenWindows({
                  data: _openWindows,
                }));

                // Use WindowService to create tab
                dispatch(windowServiceActions.openNewTab({
                    windowId: _result.id,
                    url: queryOrUrl
                }));

                dispatch(sessionActions.setActiveWindow({data: _result}));
                dispatch(sessionActions.addBrowserWindow({data: _id}));
                dispatch(sessionActions.setActiveBrowserWindowId({data: _id}));
                setSearchQuery("");
            },
        );
    }
}

export function handleSearch(
    searchQuery: any, searchEngine: any, links: any, apps: any, openWindows: any, dispatch: any, sessionActions: any, appActions: any, setSearchQuery: any,
    desktop: any, workspace: any, activeBrowserWindowId: any, activeTabs: any, isLocal: any, openTabs: any, windowTabs: any, sessionState: any
    ){
    if(searchQuery === ""){
        return;
    }
    let _query = searchQuery.replace("http://", "").replace("https://", "");

    let _url = searchEngine.search+_query;

    if(isValidDomain4(_query)){
        _url = "https://"+_query;
        let _hostname = new URL(_url).hostname;
        let _domain = _hostname.replace("www.","");
        log.debug("links", links);
        let _link = links.find((link: any) => link.domain.includes(_domain));
        let _app = apps.find((app: any) => app.domain.includes(_domain));
        if(_link !== undefined){
            log.debug("Link found", _link);
            if(openWindows[_link.id] != null){
                //add new tab

                //activate window
                dispatch(sessionActions.setActiveWindow({data: openWindows[_link.id]}));
                if(openWindows[_link.id].sleeping === true){
                    dispatch(appActions.showSplashScreen());
                }
            }else{
                // open new link window
                handleOpenLinkWindow(_link, "", links, openWindows, isLocal, dispatch, sessionActions, appActions, desktop, workspace, openTabs, windowTabs, sessionState);
            }
        }else if(_app){
            log.debug("App found", _app);
            if(openWindows[_app.id] != null){
                //add new tab

                //activate window
                dispatch(sessionActions.setActiveWindow({data: openWindows[_app.id]}));
                if(openWindows[_app.id].sleeping === true){
                    dispatch(appActions.showSplashScreen());
                }
            }else{
                log.debug("Open new App");

            }
        }else{
            handleSearchEngine(
                _url, links, openWindows, dispatch, sessionActions, appActions,
                setSearchQuery, searchQuery, desktop, workspace, activeBrowserWindowId, activeTabs, isLocal,
                openTabs, windowTabs, sessionState
                );
        }
    }else{
        handleSearchEngine(
            _url, links, openWindows, dispatch, sessionActions, appActions,
            setSearchQuery, searchQuery, desktop, workspace, activeBrowserWindowId, activeTabs, isLocal,
            openTabs, windowTabs, sessionState
            );
    }

    setSearchQuery("");

}
