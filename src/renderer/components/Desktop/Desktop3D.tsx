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
}

/**
 * Full-viewport 3D Desktop — Scene of open windows with live projected webviews.
 */
function Desktop3D({ id, name, clearZoomToken = 0 }: Desktop3DProps) {
  const dispatch = useDispatch();
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen || false);
  const isDesktopsEnabled = useSelector(
    (state: any) => state.settings.isDesktopsEnabled
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const [windowFocused, setWindowFocused] = useState(false);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [localClearZoomToken, setLocalClearZoomToken] = useState(0);

  useEffect(() => {
    if (!clearZoomToken) return;
    setLocalClearZoomToken(clearZoomToken);
  }, [clearZoomToken]);

  const onZoomedChange = useCallback((zoomed: boolean, cardId?: string | null) => {
    setWindowFocused(zoomed);
    setFocusedCardId(zoomed ? cardId ?? null : null);
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
        isAIAssistantOpen ? "chat-assistant-open" : ""
      } ${windowFocused ? "desktop-3d-window-focused" : ""}`}
    >
      <DesktopMenu />

      <div
        className={`desktop-top-controls d-flex align-items-center ${
          isAIAssistantOpen ? "chat-assistant-open" : ""
        }`}
      >
        <Button
          id="space-apps-add-button-3d-desktop"
          color="light"
          className="btn-sm mr-2"
          onClick={toggleAppStore}
          title="Add app"
        >
          <Plus />
        </Button>
        <Desktop3DChrome showLayoutControls={false} />
        <Button
          color="dark"
          onClick={() => dispatch(aiAppsActions.toggle("ai"))}
          className="chat-assistant-button"
          title="AI Assistant"
        >
          <Robot size={16} />
        </Button>
      </div>

      <div className="desktop-3d-overlay-top">
        {!windowFocused && (
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
          {windowFocused ? (
            <Desktop3DAddressBar onClose={leaveFocusedWindow} />
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

      <DesktopWindows3D
        clearZoomToken={localClearZoomToken}
        onZoomedChange={onZoomedChange}
      />
      {/* Live guests must sit in this stacking context above the WebGL canvas */}
      <Desktop3DWebViewHost />
      {windowFocused ? (
        <Desktop3DTabDots focusedCardId={focusedCardId} />
      ) : null}
    </div>
  );
}

export default Desktop3D;
