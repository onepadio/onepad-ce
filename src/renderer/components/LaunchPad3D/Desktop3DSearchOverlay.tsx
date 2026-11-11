import { Search } from "react-bootstrap-icons";
import { useDispatch } from "react-redux";

import { modalActions } from "../../store/modal-slice";

import "./Desktop3DSearchOverlay.css";

/**
 * Compact search trigger for 3D overview — opens the center search overlay.
 */
function Desktop3DSearchOverlay() {
  const dispatch = useDispatch();

  return (
    <div className="desktop-3d-search-overlay">
      <button
        type="button"
        className="desktop-3d-search-trigger"
        title="Search"
        aria-label="Open search"
        onClick={() => dispatch(modalActions.showCenterSearch())}
      >
        <Search size={18} />
      </button>
    </div>
  );
}

export default Desktop3DSearchOverlay;
