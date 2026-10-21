import { useCallback, useEffect, useState } from "react";
import { Button } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { Robot, Plus } from "react-bootstrap-icons";

import DateTime from "../DateTime/DateTime";
import DesktopMenu from "../DesktopMenu/DesktopMenu";
import DesktopWindows3D from "../LaunchPad3D/DesktopWindows3D";
import Desktop3DChrome from "../LaunchPad3D/Desktop3DChrome";
import Desktop3DWebViewHost from "../LaunchPad3D/Desktop3DWebViewHost";
import Desktop3DOverlayApps from "./Desktop3DOverlayApps";
import Desktop3DAddressBar from "../LaunchPad3D/Desktop3DAddressBar";
import Desktop3DTabDots from "../LaunchPad3D/Desktop3DTabDots";
import OthersWindowSwitcher from "../LaunchPad3D/OthersWindowSwitcher";
import OverviewTabSwitcher from "../LaunchPad3D/OverviewTabSwitcher";
import ScreenOpacitySlider from "../LaunchPad3D/ScreenOpacitySlider";
import Desktop3DSearchOverlay from "../LaunchPad3D/Desktop3DSearchOverlay";
import { getExperience } from "../LaunchPad3D/experiences/registry";
import {
  EXPERIENCE_MODELS,
  preloadExperienceModels,
} from "../LaunchPad3D/experiences";
import { aiAppsActions } from "renderer/store/ai-slice";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";
import { isDesktop3dOverlayWindow } from "../../util/sharedApps";

import "./Desktop.css";
import "../LaunchPad3D/LaunchPad3D.css";

const SHARED_MODEL_URLS = Object.values(EXPERIENCE_MODELS);

interface Desktop3DProps {
  id: string;
  name: string;
  /** When true, force scene overview (launchpad overlay open) */
  clearZoomToken?: number;
  /** Warm-space: filter / bind to this workspace */
  workspaceId?: string | null;
  /** Warm-space: pause canvas when hidden */
  sceneActive?: boolean;
}

/**
 * Full-viewport 3D Desktop — desk + window vista of open windows.
 */
function Desktop3D({
  id,
  name,
  clearZoomToken = 0,
  workspaceId = null,
  sceneActive = true,
}: Desktop3DProps) {
  const dispatch = useDispatch();
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen || false);
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const experienceIdFromSettings = useSelector(
    (state: any) => state.settings.desktop3dExperience || "control-room"
  );
  const warmCache = useSelector(
    (state: any) => state.workspace.warmSpaceCache || {}
  );
  const experienceId =
    workspaceId && workspaceId !== workspace?.id
      ? warmCache[workspaceId]?.workspace?.config?.desktop3dExperience ||
        experienceIdFromSettings
      : experienceIdFromSettings;
  const experience = getExperience(experienceId);
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const openWindows = useSelector((state: any) => state.session.openWindows);
  const homeWorkspaceId = useSelector(
    (state: any) => state.user.homeWorkspace
  );
  const overlayFocused = isDesktop3dOverlayWindow(
    activeWindowId ? openWindows?.[activeWindowId] : null,
    homeWorkspaceId
  );
  const deskFrontCardId = useSelector(
    (state: any) => state.windowService.desktop3dDeskWindowId || ""
  );
  const [windowFocused, setWindowFocused] = useState(false);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [localClearZoomToken, setLocalClearZoomToken] = useState(0);
  const [exploreMode, setExploreMode] = useState(false);
  const hudFocused = windowFocused || overlayFocused;

  useEffect(() => {
    if (!clearZoomToken) return;
    setLocalClearZoomToken(clearZoomToken);
  }, [clearZoomToken]);

  useEffect(() => {
    if (!sceneActive) return;
    preloadExperienceModels(SHARED_MODEL_URLS);
  }, [sceneActive]);

  useEffect(() => {
    if (!sceneActive) return;
    const onClear = () => setLocalClearZoomToken((t) => t + 1);
    window.addEventListener("desktop3d-clear-zoom", onClear);
    return () => window.removeEventListener("desktop3d-clear-zoom", onClear);
  }, [sceneActive]);

  // Classic control room has no desk window — leave explore if switching worlds
  useEffect(() => {
    if (experience.usesDeskRoom === false && exploreMode) {
      setExploreMode(false);
    }
  }, [experience.usesDeskRoom, exploreMode]);

  useEffect(() => {
    if (overlayFocused) setExploreMode(false);
  }, [overlayFocused]);

  const onZoomedChange = useCallback((zoomed: boolean, cardId?: string | null) => {
    setWindowFocused(zoomed);
    setFocusedCardId(zoomed ? cardId ?? null : null);
    if (zoomed) setExploreMode(false);
  }, []);

  const leaveFocusedWindow = useCallback(() => {
    if (overlayFocused) {
      window.dispatchEvent(new CustomEvent("desktop3d-overlay-dismiss"));
      return;
    }
    setLocalClearZoomToken((t) => t + 1);
  }, [overlayFocused]);

  function toggleAppStore() {
    dispatch(storeActions.setSelectedStore("web"));
    dispatch(modalActions.setLocation("launchpad"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  return (
    <div
      id={id}
      className={`desktop-3d-fullscreen desktop-3d-room-scene ${
        experience.cssClass
      } ${isAIAssistantOpen ? "chat-assistant-open" : ""} ${
        hudFocused ? "desktop-3d-window-focused" : ""
      } ${sceneActive ? "" : "desktop-3d-scene-paused"}`}
    >
      {sceneActive ? <DesktopMenu /> : null}

      {sceneActive ? (
        <div
          className={`desktop-top-controls d-flex align-items-center ${
            isAIAssistantOpen ? "chat-assistant-open" : ""
          }`}
        >
          <Desktop3DChrome
            showLayoutControls={false}
            showExperienceSetup
            exploreMode={exploreMode}
            onExploreModeChange={setExploreMode}
          />
          <Button
            color="dark"
            onClick={() => dispatch(aiAppsActions.toggle("ai"))}
            className="chat-assistant-button"
            title="AI Assistant"
          >
            <Robot size={16} />
          </Button>
        </div>
      ) : null}

      {sceneActive ? (
        <div className="desktop-3d-overlay-top">
          {!hudFocused && !exploreMode && (
            <div className="desktop-3d-overlay-title">
              <Desktop3DSearchOverlay />
            </div>
          )}
          <div className="desktop-3d-overlay-center">
            {hudFocused && !exploreMode ? (
              <Desktop3DAddressBar onClose={leaveFocusedWindow} />
            ) : exploreMode ? (
              <div className="desktop-3d-explore-hint">Looking out the window</div>
            ) : (
              <>
                <DateTime />
                <OthersWindowSwitcher
                  deskFrontCardId={deskFrontCardId}
                  visible={!hudFocused && !exploreMode}
                />
              </>
            )}
          </div>
        </div>
      ) : null}

      <DesktopWindows3D
        clearZoomToken={localClearZoomToken}
        onZoomedChange={onZoomedChange}
        workspaceId={workspaceId || workspace?.id}
        sceneActive={sceneActive}
        exploreMode={exploreMode}
        onExploreModeChange={setExploreMode}
        experienceId={experienceId}
        overlayAppFocused={overlayFocused}
        overlayWindowId={overlayFocused ? activeWindowId : null}
      />
      {sceneActive ? <Desktop3DWebViewHost /> : null}
      {sceneActive ? <Desktop3DOverlayApps /> : null}
      {sceneActive && !exploreMode && !hudFocused ? (
        <OverviewTabSwitcher
          deskFrontCardId={deskFrontCardId}
          visible={!hudFocused && !exploreMode}
        />
      ) : null}
      {sceneActive && !exploreMode && !hudFocused ? (
        <ScreenOpacitySlider
          deskFrontCardId={deskFrontCardId}
          visible={!hudFocused && !exploreMode}
        />
      ) : null}
      {sceneActive && !exploreMode && hudFocused ? (
        <Desktop3DTabDots focusedCardId={focusedCardId} />
      ) : null}
    </div>
  );
}

export default Desktop3D;
