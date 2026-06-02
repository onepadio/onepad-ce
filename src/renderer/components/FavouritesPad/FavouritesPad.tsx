import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Star } from "react-bootstrap-icons";
import { modalActions } from "../../store/modal-slice";
import FavouritesPadBody from "./FavouritesPadBody";
import "./FavouritesPad.css";

function FavouritesPad(props: any) {
  const dispatch = useDispatch();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay setting visibility to trigger animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  function hideFavouritesPad() {
    setIsVisible(false);
    // Wait for animation to complete before dispatching hide action
    setTimeout(() => {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dispatch(modalActions.hideFavouritesPad());
    }, 300); // Match this with CSS transition duration
  }

  return (
    <>
      <div
        id="launchpad-backdrop"
        className={`launchpad-backdrop ${isVisible ? 'visible' : ''}`}
        onClick={() => hideFavouritesPad()}
      ></div>
      <div
        id="favourites-pad-id"
        className={`favourites-pad-modal ${isVisible ? 'visible' : ''}`}
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
        onMouseEnter={() => dispatch(modalActions.showFavouritesPad())}
        onMouseLeave={() => hideFavouritesPad()}
      >
        <h2 className="favourites-title d-flex align-items-center justify-content-center mt-2">
          <Star color="white" size={24} />
          <span className="ms-2 text-white">Favourites</span>
        </h2>
        <FavouritesPadBody />
      </div>
    </>
  );
}

export default FavouritesPad;
