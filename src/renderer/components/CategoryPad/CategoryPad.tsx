import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { modalActions } from "../../store/modal-slice";
import CategoryPadBody from "./CategoryPadBody";

interface CategoryPadProps {
  category: "favourites" | "search" | "social";
}

function CategoryPad({ category }: CategoryPadProps) {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay setting visibility to trigger animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  function hideCategoryPad() {
    setIsVisible(false);
    // Wait for animation to complete before dispatching hide action
    setTimeout(() => {
      dispatch(modalActions.hideCategoryPad({}));
    }, 300); // Match this with CSS transition duration
  }

  return (
    <>
      <div
        id="category-pad-backdrop"
        className={`category-pad-backdrop ${isVisible ? 'visible' : ''}`}
        onClick={() => hideCategoryPad()}
        style={{ display: 'block' }}
      ></div>
      <div
        id="category-pad-id"
        className={`category-pad-modal ${isVisible ? 'visible' : ''}`}
        style={{ display: 'block' }}
        onMouseEnter={() => dispatch(modalActions.showCategoryPad({}))}
      >
        <CategoryPadBody category={category} />
      </div>
    </>
  );
}

export default CategoryPad;
