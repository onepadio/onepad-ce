import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import log from "loglevel";
import isUrlHttp from "is-url-http";

import { LinkService } from "../../services/link";

import { sessionActions } from '../../store/session-slice';
import { launchpadActions } from "../../store/launchpad-slice";
import { appActions } from '../../store/app-slice';
import { utilityAppsActions } from "../../store/utility-slice";
import { windowServiceActions } from "../../store/window-service-slice";

import {
    Input,
    Button
  } from "reactstrap";
import { v4 as uuidv4 } from 'uuid';

import { openInternalWindow} from '../../services/window'
// @ts-expect-error
import googleIcon from '../../images/google_icon.png'
// @ts-expect-error
import globe_icon from '../../images/globe_icon_96.png';
import './SearchBar.css'

import { itemsDb } from "../../data/store";
import { utilityAppItemsDb, utilityAppSearch } from "../UtilityAppsCanvas/utility_apps";
import { createNavHistoryState } from "../../util/navHistory";

function SearchBar(props: any){
    const dispatch = useDispatch();

    const workspace = useSelector((state: any) => state.workspace.selectedWorkspace);

    const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const openTabs = useSelector((state: any) => state.session.openTabs);

    const windowTabs = useSelector((state: any) => state.session.windowTabs);

    const links = useSelector((state: any) => state.workspace.links);

    const apps = useSelector((state: any) => state.workspace.apps);

    const isLocal = useSelector((state: any) => state.workspace.isLocal);

    const activeBrowserWindowId = useSelector((state: any) => state.session.activeBrowserWindowId);

    const activeWindow = useSelector((state: any) => state.session.activeWindow);

    const activeTabs = useSelector((state: any) => state.session.activeTabs);

    const isSpaceBrowserEnabled = useSelector((state: any) => state.settings.isSpaceBrowserEnabled);

    const sessionState = useSelector((state: any) => state.session);

    const searchEngine = useSelector((state: any) => state.windowService.searchEngine);

    const [searchQuery, setSearchQuery] = useState("");

    function validURLHttp(str: any) {
        var pattern = new RegExp('^(http?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    }

    function isValidDomain(domain: any) {
        const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+([a-zA-Z]{2,63}|[a-zA-Z]{2,63}\.[a-zA-Z]{2,63})$/;
        return domainRegex.test(domain);
    }

    function isValidDomain2(url: any) {
        const domainRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-_]{1,63}\.)+([a-zA-Z]{2,63}|[a-zA-Z]{2,63}\.[a-zA-Z]{2,63})(:\d{1,5})?(\/|$)/;
        return domainRegex.test(url);
    }

    function isValidDomain3(url: any) { // to handle www.airbnb.co.uk
        const domainRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.)+([a-zA-Z]{2,63})(\.[a-zA-Z]{2,63})?(:(\d{1,5}))?(\/|$)/;
        return domainRegex.test(url);
    }

    function isValidDomain4(url: any) {
        const domainRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]{1,63}\.)+([a-zA-Z]{2,63})(\.[a-zA-Z]{2,63})?(:(\d{1,5}))?(\/|$)/;
        return domainRegex.test(url);
    }

    function handleSearch(){
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
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(appActions.showSplashScreen());
                    }
                }else{
                    // open new link window
                    handleOpenLinkWindow(_link);
                }
            }else if(_app){
                log.debug("App found", _app);
                if(openWindows[_app.id] != null){
                    //add new tab

                    //activate window
                    dispatch(sessionActions.setActiveWindow({data: openWindows[_app.id]}));
                    if(openWindows[_app.id].sleeping === true){
                        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                        dispatch(appActions.showSplashScreen());
                    }
                }else{
                    log.debug("Open new App");
                    //handleOpenLinkWindow(_app);
                }
            }else{
                handleSearchEngine(_url);
            }
        }else{
            handleSearchEngine(_url);
        }

        setSearchQuery("");

    }

    function openSearcWindow(_url: any){
        let _previousItemId = undefined;
        let _state = JSON.parse(localStorage.getItem("utility-window-state"));
        if(_state["search"] !== undefined){
            _previousItemId = _state["search"];
        }
        let _item = undefined;
        if(_previousItemId !== undefined && _previousItemId !== null && _previousItemId !== ""){
            _item = utilityAppSearch[_previousItemId];
        }else{
            _item = utilityAppSearch[utilityAppItemsDb["search"][0]];
        }
    }

    function handleSearchEngine(_url: any){
        //search engine
        let _domain = new URL(_url).hostname.replace("www.","");
        log.debug("links", links);
        let _link = links.find((link: any) => link.domain.includes(_domain));
        if(_link !== undefined){
            log.debug("Search engine found", _link);
            if(openWindows[_link.id] != null){
                dispatch(sessionActions.setActiveWindow({data: openWindows[_link.id]}));
                if(openWindows[_link.id].sleeping === true){
                    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                    dispatch(appActions.showSplashScreen());
                }
            }else{
                handleOpenLinkWindow(_link, _url);
            }
        }else{
            handleSpaceBrowserSearch(_url);
        }
    }

    function searchOnSystemBrowser(url: any){
        log.debug("searchQuery", searchQuery);
        // open in system browser
        window.open(url, '_blank');
        setSearchQuery("");
    }

    function handleOpenLinkWindow(link: any , url = ""){
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
                        let _tab = linkTab(link.id, tabState.url, tabState.icon, tabState.title);
                        _openTabs[_tab.id] = _tab;
                        _tabIds.push(_tab.id);
                    });
                }else{
                    let _url = url !== "" ? url : link.data.startUrl;
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
                // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
                dispatch(appActions.showSplashScreen());
            },
        );
    }

    function linkTab(windowId: any, url: any, icon: any, title: any){
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

    function handleSpaceBrowserSearch(queryOrUrl: any){
        log.debug("searchQuery", searchQuery);
        let _openWindows = Object.assign({}, openWindows);
        let _openTabs = Object.assign({}, openTabs);
        let _windowTabs = Object.assign({}, windowTabs);
        let _id = "browser_".concat(workspace.id);
        if(_openWindows[_id] !== undefined){
            let window = _openWindows[_id];

            // Use WindowService to create tab (WindowService will activate the window after tab is created)
            dispatch(windowServiceActions.openNewTab({
                windowId: window.id,
                url: queryOrUrl
            }));

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

    return(
        <form
            className="d-none d-sm-inline-block form-inline ml-md-3 my-2 my-md-0 mw-100 navbar-search"
            onSubmit={(e) => {
                e.preventDefault()
                handleSearch()
            }}
            onKeyDown={(e) => {
                if(e.key === "Enter"){
                    e.preventDefault();
                    handleSearch();
                }
            }}
        >
            {}
            <div className="input-group">
                <div>
                    <Button className="google-search-button h-100" color="dark" onClick={handleSearch}>
                        <img src={searchEngine.icon} width="20" height="20" alt="Search Engine Logo" className="rounded"/>
                    </Button>
                </div>
                <Input
                    id={props.id}
                    name="startUrl"
                    placeholder="Search or enter website address"
                    type="text"
                    className="form-control bg-dark border-0 small text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search" aria-describedby="basic-addon2"
                />

            </div>
        </form>
    )

}

export default SearchBar;
