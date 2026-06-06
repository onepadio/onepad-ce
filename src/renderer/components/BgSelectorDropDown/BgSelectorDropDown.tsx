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

// Pexels client should be created only once outside component
const pexelsClient = createClient('4Qpo6sLZ2hjfUkyERXQrQzKbcbew6EQtIr3cPQLnMp26S9urGttwX8rg');

// Base local images for each category
const LOCAL_IMAGES = {
    "Beach": [beach_1, beach_2, beach_3],
    "Nature": [default_bg, tso_2, tso_4, bg1],
    "Space": [tso_1, tso_3],
};

// Category to Pexels search query mapping
const CATEGORY_QUERIES = {
    "Beach": "beach ocean",
    "Nature": "nature landscape",
    "Space": "space galaxy stars",
};

function BgSelectorDropDown(props: any) {
    const [activeCategory, setActiveCategory] = useState("Beach");
    const [backgroundCategories, setBackgroundCategories] = useState({
        "Beach": LOCAL_IMAGES.Beach,
        "Nature": LOCAL_IMAGES.Nature,
        "Space": LOCAL_IMAGES.Space,
        "Search": []
    });
    const [pexelQuery, setPexelQuery] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [pexelsCache, setPexelsCache] = useState<Record<string, string[]>>({});
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);


    function fetchPexelsImages(query: string, category: string) {
        if (query === "") return;
        
        // Check if already cached
        if (pexelsCache[category]) {
            const localImages = LOCAL_IMAGES[category] || [];
            setBackgroundCategories(prev => ({
                ...prev,
                [category]: [...localImages, ...pexelsCache[category]]
            }));
            return;
        }

        const orientation = 'landscape';
        let _pexelPhotos: any = [];
        setIsSearching(true);
        setSearchError(null);
        
        pexelsClient.photos.search({ query, orientation, per_page: 12 }).then(photos => {
            // @ts-expect-error
            photos.photos.forEach((photo: any) => {
                _pexelPhotos.push(photo.src.original);
            });
            
            // Cache the results
            setPexelsCache(prev => ({
                ...prev,
                [category]: _pexelPhotos
            }));
            
            // Combine local + pexels images
            const localImages = LOCAL_IMAGES[category] || [];
            setBackgroundCategories(prev => ({
                ...prev,
                [category]: [...localImages, ..._pexelPhotos]
            }));
            
            setIsSearching(false);
        }).catch(error => {
            console.error("Error getting background images", error);
            setIsSearching(false);
            setSearchError(error.message);
        });
    }

    function fetchSearchResults(query: string) {
        if (query === "") return;
        
        const orientation = 'landscape';
        let _pexelPhotos: any = [];
        setIsSearching(true);
        setSearchError(null);
        
        pexelsClient.photos.search({ query, orientation, per_page: 20 }).then(photos => {
            // @ts-expect-error
            photos.photos.forEach((photo: any) => {
                _pexelPhotos.push(photo.src.original);
            });
            
            setBackgroundCategories(prev => ({
                ...prev,
                "Search": _pexelPhotos
            }));
            
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
        
        // Fetch Pexels images for predefined categories if not already loaded
        if (category !== "Search" && CATEGORY_QUERIES[category] && !pexelsCache[category]) {
            fetchPexelsImages(CATEGORY_QUERIES[category], category);
        }
    }



    // Load initial category Pexels images on mount
    useEffect(() => {
        if (activeCategory !== "Search" && CATEGORY_QUERIES[activeCategory] && !pexelsCache[activeCategory]) {
            fetchPexelsImages(CATEGORY_QUERIES[activeCategory], activeCategory);
        }
    }, []);

    // Handle custom search
    useEffect(() => {
        let isMounted = true;
        
        if (searchQuery && isMounted) {
            fetchSearchResults(searchQuery);
        }
        
        return () => {
            isMounted = false;
        };
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
                <div className="bg-selector-grid">
                    {searchError && (
                        <div className="d-flex flex-fluid justify-content-center">
                            <span className="ml-2" style={{ color: '#ff6b6b' }}>Error: {searchError}</span>
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
                                loading="lazy"
                                // @ts-expect-error
                                value={bg}
                            />
                        </div>
                    ))}
                    {isSearching && (
                        <div className="loading-more-indicator">
                            <Spinner color="primary" size="sm" />
                            <span style={{ marginLeft: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                Loading more images...
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BgSelectorDropDown;
