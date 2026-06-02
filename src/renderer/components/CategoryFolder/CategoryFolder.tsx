import React from "react";
import { useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import { Star, Search, Instagram } from "react-bootstrap-icons";
import { Instagram as InstagramFeather } from "react-feather";

import "../LaunchIcon/LaunchIcon.css";

interface CategoryFolderProps {
  category: "favourites" | "search" | "social";
  showStatusDot?: boolean;
}

function CategoryFolder({ category, showStatusDot = false }: CategoryFolderProps) {
  const dispatch = useDispatch();

  const getCategoryIcon = () => {
    switch (category) {
      case "favourites":
        return <Star color="white" size={20} />;
      case "search":
        return <Search color="white" size={18} />;
      case "social":
        return <InstagramFeather color="white" size={18} />;
      default:
        return <Star color="white" size={20} />;
    }
  };

  const getCategoryName = () => {
    switch (category) {
      case "favourites":
        return "Favourites";
      case "search":
        return "Search";
      case "social":
        return "Social";
      default:
        return "Category";
    }
  };

  const handleClick = () => {
    dispatch(modalActions.setSelectedCategory(category));
    dispatch(modalActions.toggleCategoryPad({ category }));
  };

  return (
    <div className="launch-icon-container">
        <div className="card p-2 text-center launch-item">
          <div
            className="d-flex justify-content-center"
            onClick={handleClick}
          >
            <div className="folder-icon">
              {getCategoryIcon()}
            </div>
            <div className="icon-middle">
              <div className="icon-text">Open {getCategoryName().toLowerCase()}</div>
            </div>
          </div>
          <div className="d-flex justify-content-center flex-column align-items-center mt-1">
            <div className="d-flex">
              {showStatusDot && (
                <span className="status-dot"></span>
              )}
              <span className={"icon-text ml-1"}>{getCategoryName()}</span>
            </div>
          </div>
        </div>
    </div>
  );
}

export default CategoryFolder;
