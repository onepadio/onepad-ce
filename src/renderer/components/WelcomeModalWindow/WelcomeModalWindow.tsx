import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from "react-redux";
import log from 'loglevel';
import {v4 as uuidv4} from 'uuid';

import { modalActions } from "../../store/modal-slice";
import { workspaceActions } from '../../store/workspace-slice';

import DesktopService from '../../services/desktop';

import { 
  Button, 
  Form,
  FormGroup,
  Label,
  Input
 } from 'reactstrap';

import {
  Carousel,
  CarouselItem,
  CarouselControl,
  CarouselIndicators,
  CarouselCaption,
} from 'reactstrap';

import Modal from "../lib/Modal";
import "./WelcomeModalWindow.css";
// @ts-expect-error
import welcome_1 from '../../images/illustrations/welcome-1.png';

const items = [
  {
    src: welcome_1,
    altText: 'Slide 1',
    caption: 'Slide 1',
    key: 1,
  }
];

function WelcomeModalWindow(props: any) {
  const dispatch = useDispatch();
  
  const userId = useSelector((state: any) => state.user.id);
  
  const desktop = useSelector((state: any) => state.workspace.selectedDesktop);

  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  

  
  const isWelcomeModalWindowOpen = useSelector((state: any) => state.modal.isWelcomeModalWindowOpen);

  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };

  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };

  const goToIndex = (newIndex: any) => {
    if (animating) return;
    setActiveIndex(newIndex);
  };

  const slides = items.map((item) => {
    return (
      <CarouselItem
        onExiting={() => setAnimating(true)}
        onExited={() => setAnimating(false)}
        key={item.src}
      >
        <img src={item.src} alt={item.altText} />
        {/* @ts-expect-error TS(2769): No overload matches this call. */}
        <CarouselCaption
        />
      </CarouselItem>
    );
  });

  function toggleWelcomeModalWindow(){
    // @ts-expect-error
    localStorage.setItem("welcome-completed", true);
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    dispatch(modalActions.toggleWelcomeModalWindow());
  }

  function done(){
    
  }

  useEffect(() => {
    log.debug("useEffect");
    
  }, []);

  return (
    <div>
      <Modal id={uuidv4()} heading="OnePad" className="welcome-modal" show={isWelcomeModalWindowOpen} onClose={() => toggleWelcomeModalWindow()}>
          <div className='container-fluid h-100'>
              <div className='row w-100 h-100'>
                  <div className='col-12'>
                  <Carousel
                    activeIndex={activeIndex}
                    next={next}
                    previous={previous}
                    slide={false}
                    {...props}
                  >
                    <CarouselIndicators
                      items={items}
                      activeIndex={activeIndex}
                      onClickHandler={goToIndex}
                    />
                    {slides}
                    <CarouselControl
                      direction="prev"
                      directionText="Previous"
                      onClickHandler={previous}
                    />
                    <CarouselControl
                      direction="next"
                      directionText="Next"
                      onClickHandler={next}
                    />
                  </Carousel>
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
}

export default WelcomeModalWindow;