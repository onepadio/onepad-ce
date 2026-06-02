import React, { useState, useEffect } from 'react';
import log from 'loglevel';
import { getRandomImage } from '../../services/unsplash';

import "./UnsplashBgImage.css";


function UnsplashBgImage(props: any) {

    function onBgSelect(event: any){
        let bg = event.target.getAttribute("value");
        // @ts-expect-error TS(2531): Object is possibly 'null'.
        document.querySelector(".bg-selector-dropdown-image-selected").src = bg;
        props.onClick(bg);
    }

    useEffect(() => {
        // @ts-expect-error TS(2554): Expected 2 arguments, but got 0.
        getRandomImage().then((data: any) => {
            log.debug(data);
            // @ts-expect-error TS(2531): Object is possibly 'null'.
            document.querySelector(".bg-selector-dropdown-image-selected").src = data;
        });
    }, []);
    
    return (
        <div className="bg-selector-dropdown-container">
            <img
                className="bg-selector-dropdown-image bg-selector-dropdown-image-selected"
                src=""
                alt="background"
            />
        </div>
    );
}

export default UnsplashBgImage;
