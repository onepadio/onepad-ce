import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "react-bootstrap-icons";

import SearchBar from "../SearchBar/SearchBar";

import "./Desktop3DSearchOverlay.css";

/**
 * Compact search trigger for 3D overview — opens an overlay SearchBar.
 */
function Desktop3DSearchOverlay() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (rootRef.current && t && !rootRef.current.contains(t)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const input = document.getElementById(
        "desktop3dSearchBar"
      ) as HTMLInputElement | null;
      input?.focus();
      input?.select();
    }, 50);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`desktop-3d-search-overlay${open ? " is-open" : ""}`}
    >
      {!open ? (
        <button
          type="button"
          className="desktop-3d-search-trigger"
          title="Search"
          aria-label="Open search"
          onClick={() => setOpen(true)}
        >
          <Search size={18} />
        </button>
      ) : (
        <div className="desktop-3d-search-panel">
          <SearchBar id="desktop3dSearchBar" onSearchComplete={close} />
        </div>
      )}
    </div>
  );
}

export default Desktop3DSearchOverlay;
