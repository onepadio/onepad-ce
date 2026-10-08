import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import { appActions } from "../../store/app-slice";

import "./SplashScreen.css"

const SPLASH_MAX_MS = 8000;

function SplashScreen(props: any) {
    const dispatch = useDispatch();

    const isVisible = useSelector((state: any) => state.app.splashScreenVisible);
    const desktopVisualMode = useSelector(
        (state: any) =>
            state.settings.desktopVisualMode ||
            state.settings.launchpadVisualMode ||
            "2d"
    );
    const is3dDesktop = desktopVisualMode === "3d";

    const isSharedAppsEnabled = useSelector((state: any) => state.settings.isSharedAppsEnabled);

    const activeWindowId = useSelector((state: any) => state.session.activeWindowId);

    const openWindows = useSelector((state: any) => state.session.openWindows);

    const isFullScreen = useSelector((state: any) => state.session.isFullScreen);

    const tabsBarVisualMode = useSelector((state: any) => state.tabsBar.mode);

    const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen);

    const [windowIcon, setWindowIcon] = useState("");
    const [progressValue, setProgressValue] = useState(0);
    const domId = "splash-screen-id";
    const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 3D desktop: never show splash — clear if something still requests it
    useEffect(() => {
        if (is3dDesktop && isVisible) {
            dispatch(appActions.hideSplashScreen({}));
        }
    }, [is3dDesktop, isVisible, dispatch]);

    useEffect(() => {
        if (is3dDesktop) return;

        const domElement = document.getElementById(domId);
        if (!domElement) return;

        if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
        }

        if(isVisible){
            domElement.classList.remove("d-none");
            setProgressValue(0.1);
            setTimeout(() => {
                setProgressValue(0.2);
            }, 100);
            setTimeout(() => {
                setProgressValue(0.3);
            }, 200);
            setTimeout(() => {
                setProgressValue(0.4);
            }, 300);
            setTimeout(() => {
                setProgressValue(0.5);
            }, 400);
            setTimeout(() => {
                setProgressValue(0.6);
            }, 500);
            setTimeout(() => {
                setProgressValue(0.9);
            }, 600);
            setTimeout(() => {
                setProgressValue(1);
            }, 700);

            // Fallback if OPWebView never reports load (offline / hang)
            safetyTimeoutRef.current = setTimeout(() => {
                dispatch(appActions.hideSplashScreen({}));
                safetyTimeoutRef.current = null;
            }, SPLASH_MAX_MS);
        }else{
            domElement.classList.add("d-none");
        }

        return () => {
            if (safetyTimeoutRef.current) {
                clearTimeout(safetyTimeoutRef.current);
                safetyTimeoutRef.current = null;
            }
        };
    }
    , [isVisible, dispatch, is3dDesktop]);

    useEffect (() => {
        let _window = openWindows[activeWindowId];
        if(_window){
            if(_window.type === "app"){
                setWindowIcon("./images/store/icon/"+_window.data.icon);
            }else if(_window.type === "link"){
                setWindowIcon(_window.data.icon);
            }else{
                setWindowIcon("icon_128x128.png");
            }
        }
    }, [activeWindowId, openWindows]);

    if (is3dDesktop) {
        return null;
    }

    return (
        <div
            id={domId}
            className={
                "d-none splash-screen d-flex flex-col justify-content-center " +
                (isFullScreen ? "full-screen " : "") +
                tabsBarVisualMode +
                (isSharedAppsEnabled ? " with-left-bar" : "") +
                (isAIAssistantOpen ? " chat-assistant-open" : "")
            }
        >
            <img className="splash-screen__icon" width={64} src={windowIcon} alt="logo" />
            <br/>
            <div className="splash-screen__text">Loading...</div>
            <progress value={progressValue} />
        </div>
    );
}

export default SplashScreen;
