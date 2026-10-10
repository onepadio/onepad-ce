import { useCallback, useEffect, useState } from "react";
import { Button } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { Robot, Plus } from "react-bootstrap-icons";

import DateTime from "../DateTime/DateTime";
import SearchBar from "../SearchBar/SearchBar";
import DesktopMenu from "../DesktopMenu/DesktopMenu";
import DesktopWindows3D from "../LaunchPad3D/DesktopWindows3D";
import Desktop3DChrome from "../LaunchPad3D/Desktop3DChrome";
import Desktop3DWebViewHost from "../LaunchPad3D/Desktop3DWebViewHost";
import Desktop3DAddressBar from "../LaunchPad3D/Desktop3DAddressBar";
import Desktop3DTabDots from "../LaunchPad3D/Desktop3DTabDots";
import { getExperience } from "../LaunchPad3D/experiences/registry";
import { aiAppsActions } from "renderer/store/ai-slice";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";

import "./Desktop.css";
import "../LaunchPad3D/LaunchPad3D.css";

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
  const isDesktopsEnabled = useSelector(
    (state: any) => state.settings.isDesktopsEnabled
  );
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
  const [windowFocused, setWindowFocused] = useState(false);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [localClearZoomToken, setLocalClearZoomToken] = useState(0);
  const [exploreMode, setExploreMode] = useState(false);

  useEffect(() => {
    if (!clearZoomToken) return;
    setLocalClearZoomToken(clearZoomToken);
  }, [clearZoomToken]);

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

  const onZoomedChange = useCallback((zoomed: boolean, cardId?: string | null) => {
    setWindowFocused(zoomed);
    setFocusedCardId(zoomed ? cardId ?? null : null);
    if (zoomed) setExploreMode(false);
  }, []);

  const leaveFocusedWindow = useCallback(() => {
    setLocalClearZoomToken((t) => t + 1);
  }, []);

  function toggleAppStore() {
    dispatch(storeActions.setSelectedStore("web"));
    dispatch(modalActions.setLocation("launchpad"));
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleAppStoreModal());
  }

  function toggleRenameDesktopModalWindow() {
    dispatch(modalActions.toggleRenameDesktopModalWindow({}));
  }

  return (
    <div
      id={id}
      className={`desktop-3d-fullscreen desktop-3d-room-scene ${
        experience.cssClass
      } ${isAIAssistantOpen ? "chat-assistant-open" : ""} ${
        windowFocused ? "desktop-3d-window-focused" : ""
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
          {!windowFocused && !exploreMode && (
            <div className="desktop-3d-overlay-title">
              {isDesktopsEnabled ? (
                <button
                  type="button"
                  className="desktop-3d-hud-title-btn"
                  onClick={() => toggleRenameDesktopModalWindow()}
                >
                  {name}
                </button>
              ) : (
                <span className="desktop-3d-hud-title">{workspace?.name}</span>
              )}
            </div>
          )}
          <div className="desktop-3d-overlay-center">
            {windowFocused && !exploreMode ? (
              <Desktop3DAddressBar onClose={leaveFocusedWindow} />
            ) : exploreMode ? (
              <div className="desktop-3d-explore-hint">Looking out the window</div>
            ) : (
              <>
                <DateTime />
                <div className="desktop-3d-overlay-search">
                  <SearchBar id="searchBar" />
                </div>
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
      />
      {sceneActive ? <Desktop3DWebViewHost /> : null}
      {sceneActive && windowFocused && !exploreMode ? (
        <Desktop3DTabDots focusedCardId={focusedCardId} />
      ) : null}
    </div>
  );
}

export default Desktop3D;
