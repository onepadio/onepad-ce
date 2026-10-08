import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ArrowClockwise, LockFill, X } from "react-bootstrap-icons";

import { OTHERS_BROWSER_CARD_ID } from "./othersBrowser";
import "./Desktop3DAddressBar.css";

interface Desktop3DAddressBarProps {
  /** Leave focused window / return to scene overview */
  onClose?: () => void;
}

/**
 * Floating pill address bar for focused 3D window — URL, reload, dismiss.
 */
function Desktop3DAddressBar({ onClose }: Desktop3DAddressBarProps) {
  const activeWindowId = useSelector(
    (state: any) => state.session.activeWindowId
  );
  const activeTabId = useSelector((state: any) => state.session.activeTabId);
  const openTabs = useSelector((state: any) => state.session.openTabs);
  const activeTabs = useSelector((state: any) => state.session.activeTabs);

  const tab =
    (activeTabId && openTabs[activeTabId]) ||
    (activeWindowId &&
      activeTabs?.[activeWindowId] &&
      openTabs[activeTabs[activeWindowId]]) ||
    null;

  const liveUrl: string =
    tab?.state?.url || tab?.url || tab?.state?.displayUrl || "";

  const [value, setValue] = useState(liveUrl);

  useEffect(() => {
    setValue(liveUrl);
  }, [liveUrl]);

  const reload = useCallback(() => {
    if (!activeWindowId) return;
    const isBrowser =
      activeWindowId.startsWith("browser_") ||
      openTabs[activeTabId]?.type === "browser";
    const host =
      document.querySelector(
        `[data-desktop3d-webview="${activeWindowId}"]`
      ) ||
      (isBrowser
        ? document.querySelector(
            `[data-desktop3d-webview="${OTHERS_BROWSER_CARD_ID}"]`
          )
        : null);
    const webview =
      (host?.querySelector("webview") as any) ||
      (document.getElementById(`webview-${activeTabId}`) as any);
    webview?.reload?.();
  }, [activeWindowId, activeTabId, openTabs]);

  const displayUrl = value || "about:blank";

  return (
    <div className="desktop-3d-address-bar" role="search">
      <span className="desktop-3d-address-bar-lock" aria-hidden>
        <LockFill size={12} />
      </span>
      <input
        className="desktop-3d-address-bar-input"
        type="text"
        value={displayUrl}
        readOnly
        title={displayUrl}
        aria-label="Page address"
      />
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={reload}
        title="Reload"
        aria-label="Reload"
      >
        <ArrowClockwise size={14} />
      </button>
      <button
        type="button"
        className="desktop-3d-address-bar-btn"
        onClick={onClose}
        title="Close"
        aria-label="Close focused window"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Desktop3DAddressBar;
