// implement a dropdown menu for selecting background images

import React, { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Spinner } from 'reactstrap';
import { createClient } from 'pexels';


import default_bg from '../../images/default_bg.jpg';
import bg1 from '../../images/pexels-roberto-nickson-2559941.jpg'
import tso_1 from '../../images/tso_1.jpg';
import tso_2 from '../../images/tso_2.jpg';
import tso_3 from '../../images/tso_3.jpg';
import tso_4 from '../../images/tso_4.jpg';

//Beach
import beach_1 from '../../images/bg/pexels-pixabay-315998.jpg';
import beach_2 from '../../images/pexels-asadphoto-457882.jpg';
import beach_3 from '../../images/tso_5.jpg';

import './BgSelectorDropDown.css';

function BgSelectorDropDown(props: any) {
    const [activeCategory, setActiveCategory] = useState("Beach");
    const client = createClient('4Qpo6sLZ2hjfUkyERXQrQzKbcbew6EQtIr3cPQLnMp26S9urGttwX8rg');
    const [backgroundCategories, setBackgroundCategories] = useState({
        "Beach": [beach_1, beach_2, beach_3],
        "Nature": [default_bg, tso_2, tso_4, bg1],
        "Space": [tso_1, tso_3],
        "Search": []
    });
    const [pexelQuery, setPexelQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);


    function randomBackgroundImages(query: any) {
        if (query === "") return;
        const orientation = 'landscape';
        let _pexelPhotos: any = [];
        setIsSearching(true);
        setSearchError(null);
        setSearchResults([]);
        client.photos.search({ query, orientation, per_page: 20 }).then(photos => {
            // @ts-expect-error
            photos.photos.forEach((photo: any) => {
                _pexelPhotos.push(photo.src.original);
            });
            let _backgroundCategories = {
                "Beach": [beach_1, beach_2, beach_3],
                "Nature": [default_bg, tso_2, tso_4, bg1],
                "Space": [tso_1, tso_3],
                "Search": _pexelPhotos,
            };
            setBackgroundCategories(_backgroundCategories);
            setIsSearching(false);
        }).catch(error => {
          console.error("Error getting background images", error);
            setIsSearching(false);
            setSearchError(error.message);
        });
    }

    function onBgSelect(event: any) {
        let bg = event.target.getAttribute("value");
        props.onClick(bg);
    }

    function handleCategoryClick(category: any) {
        setActiveCategory(category);
    }



    useEffect(() => {
        randomBackgroundImages(searchQuery);
    }, [searchQuery]);

    return (
        <div className="bg-selector-container">
            <div className="categories-nav">
                {Object.keys(backgroundCategories).map((category) => (
                    <div
                        key={category}
                        className={`category-item ${category === activeCategory ? 'active' : ''}`}
                        onClick={() => handleCategoryClick(category)}
                    >
                        {category}
                    </div>
                ))}
            </div>
            <div className="bg-selector-grid-container">
                {activeCategory === "Search" && (
                    <div className="query-field-container d-flex justify-content-center align-items-center">
                        <input
                            type="text"
                            value={pexelQuery}
                            onChange={(e) => setPexelQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearchQuery(pexelQuery);
                                }
                            }}
                            className="mr-2"
                            placeholder="Nature, Ocean, etc."
                        />
                        <Button color="primary" size="sm" type="button" onClick={() => setSearchQuery(pexelQuery)}>
                            <i className="fas fa-search"></i>
                        </Button>
                    </div>
                )}
                {isSearching && (
                        <div className="d-flex flex-fluid justify-content-center mt-2">
                            <Spinner color="primary" />
                        </div>
                )}
                <div className="bg-selector-grid">

                    {searchError && (
                        <div className="d-flex flex-fluid justify-content-center">
                            <span className="ml-2">Error: {searchError}</span>
                        </div>
                    )}
                    {backgroundCategories[activeCategory].map((bg: any, index: any) => (
                        <div
                            key={index}
                            className="bg-selector-grid-item"
                            onClick={(e) => onBgSelect(e)}
                        >
                            <img
                                className="bg-selector-grid-image"
                                src={bg}
                                alt={`background ${index}`}
                                // @ts-expect-error
                                value={bg}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default BgSelectorDropDown;
