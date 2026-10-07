import { Button } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { Robot, Plus } from "react-bootstrap-icons";

import DateTime from "../DateTime/DateTime";
import SearchBar from "../SearchBar/SearchBar";
import DesktopMenu from "../DesktopMenu/DesktopMenu";
import LaunchPad3D from "../LaunchPad3D/LaunchPad3D";
import Desktop3DChrome from "../LaunchPad3D/Desktop3DChrome";
import { usesRoomScene } from "../LaunchPad3D/layouts/layoutMath";
import type { Launchpad3dLayoutId } from "../LaunchPad3D/types";
import { aiAppsActions } from "renderer/store/ai-slice";
import { modalActions } from "../../store/modal-slice";
import { storeActions } from "../../store/store-slice";

import "./Desktop.css";
import "../LaunchPad3D/LaunchPad3D.css";

interface Desktop3DProps {
  id: string;
  name: string;
  isLaunchpadActive?: boolean;
}

/**
 * Full-viewport 3D Desktop.
 * Cover / Mission / Ring float over the wallpaper;
 * Scene uses the control-room environment + console layout.
 */
function Desktop3D({ id, name, isLaunchpadActive = true }: Desktop3DProps) {
  const dispatch = useDispatch();
  const isAIAssistantOpen = useSelector((state: any) => state.ai.isOpen || false);
  const isDesktopsEnabled = useSelector(
    (state: any) => state.settings.isDesktopsEnabled
  );
  const workspace = useSelector(
    (state: any) => state.workspace.selectedWorkspace
  );
  const desktop3dLayout = useSelector(
    (state: any) =>
      (state.settings.desktop3dLayout ||
        state.settings.launchpad3dLayout ||
        "coverflow") as Launchpad3dLayoutId
  );
  const roomScene = usesRoomScene(desktop3dLayout);

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
      className={`desktop-3d-fullscreen ${
        roomScene ? "desktop-3d-room-scene" : "desktop-3d-wallpaper-scene"
      } ${isAIAssistantOpen ? "chat-assistant-open" : ""} ${
        !isLaunchpadActive ? "d-none" : ""
      }`}
    >
      <DesktopMenu />

      <div
        className={`desktop-top-controls d-flex align-items-center ${
          isAIAssistantOpen ? "chat-assistant-open" : ""
        }`}
      >
        <Desktop3DChrome />
        <Button
          id="space-apps-add-button-3d-desktop"
          color="light"
          className="btn-sm"
          onClick={toggleAppStore}
          title="Add app"
        >
          <Plus />
        </Button>
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
        <div className="desktop-3d-overlay-center">
          <DateTime />
          <div className="desktop-3d-overlay-search">
            <SearchBar id="searchBar" />
          </div>
        </div>
      </div>

      <LaunchPad3D fullscreen={roomScene} showChrome={false} />
    </div>
  );
}

export default Desktop3D;
